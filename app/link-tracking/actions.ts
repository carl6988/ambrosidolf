"use server";

import Papa from "papaparse";
import { revalidatePath } from "next/cache";
import { runSltBioSync, type SyncResult, type SyncSummary } from "@/lib/slt-bio-sync";
import { ingestLinkClickImportRow } from "@/lib/ingest/link-clicks";

export type { SyncResult, SyncSummary };

// Short lookback for the manual button — a quick recheck of recent activity.
// The daily cron job (app/api/cron/sync-slt-bio) uses a much longer one to
// cover the full gap since its last run.
const MANUAL_SYNC_LOOKBACK_HOURS = 3;

export async function syncSltBio(): Promise<SyncResult> {
  const result = await runSltBioSync({
    lookbackHours: MANUAL_SYNC_LOOKBACK_HOURS,
    maxPages: 5,
  });

  if ("summary" in result) {
    revalidatePath("/link-tracking");
    revalidatePath("/creators");
  }
  return result;
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
