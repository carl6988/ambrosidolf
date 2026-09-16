"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { fetchSltBioLinkClicks } from "@/lib/slt-bio";
import {
  ingestLinkClickEvents,
  ingestLinkClickImportRow,
} from "@/lib/ingest/link-clicks";

// Kept deliberately short: /v1/events on the upstream API gets slower
// roughly linearly with the number of events in range and reliably times
// out (502) past ~1000 events / ~20s — observed around a 3h window on this
// account. Upserts make repeated overlapping syncs safe, so re-clicking
// "Jetzt synchronisieren" often is cheap and catches up incrementally
// rather than risking one large, slow request.
const SYNC_LOOKBACK_HOURS = 3;

export type SyncSummary = {
  fetched: number;
  matchedDays: number;
  unmatchedDays: number;
  unmatchedPageSlugs: string[];
  partialFetchError: string | null;
};
export type SyncResult = { error: string } | { summary: SyncSummary };

export async function syncSltBio(): Promise<SyncResult> {
  if (!process.env.SLT_BIO_API_KEY) {
    return { error: "SLT_BIO_API_KEY ist nicht konfiguriert (.env)." };
  }

  const since = new Date();
  since.setUTCHours(since.getUTCHours() - SYNC_LOOKBACK_HOURS);

  const { events, error: fetchError } = await fetchSltBioLinkClicks({
    since: since.toISOString(),
    maxPages: 5,
  });

  // Even if pagination was cut short by a transient upstream error, ingest
  // whatever was fetched before failing rather than discarding it — the
  // next sync will pick up where this one left off (since is a fixed
  // lookback window, not a persisted cursor).
  if (events.length === 0 && fetchError) {
    return { error: fetchError };
  }

  const result = await ingestLinkClickEvents(
    events.map((e) => ({
      pageSlug: e.page_slug,
      createdAt: e.created_at,
      sessionId: e.session_id,
    })),
    "slt.bio"
  );

  revalidatePath("/link-tracking");
  revalidatePath("/creators");
  return {
    summary: {
      fetched: events.length,
      matchedDays: result.matchedDays,
      unmatchedDays: result.unmatchedDays,
      unmatchedPageSlugs: result.unmatchedPageSlugs,
      partialFetchError: fetchError,
    },
  };
}

export type CsvImportSummary = {
  total: number;
  successCount: number;
  errors: { row: number; message: string }[];
};
export type CsvImportResult = { error: string } | { summary: CsvImportSummary };

export async function importLinkClicksCsv(
  formData: FormData
): Promise<CsvImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine CSV-Datei auswählen." };
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    return { error: `CSV konnte nicht gelesen werden: ${parsed.errors[0].message}` };
  }
  if (parsed.data.length === 0) {
    return { error: "Die CSV-Datei enthält keine Zeilen." };
  }

  const errors: { row: number; message: string }[] = [];
  let successCount = 0;

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const result = await ingestLinkClickImportRow(
      {
        accountUsername: raw.account_username || null,
        postUrl: raw.post_url || null,
        date: raw.date ?? "",
        clicks: Number(raw.clicks),
        uniqueClicks: raw.unique_clicks ? Number(raw.unique_clicks) : null,
      },
      "slt.bio-csv"
    );

    if (result.success) {
      successCount++;
    } else {
      errors.push({ row: i + 2, message: result.error });
    }
  }

  revalidatePath("/link-tracking");
  return { summary: { total: parsed.data.length, successCount, errors } };
}
