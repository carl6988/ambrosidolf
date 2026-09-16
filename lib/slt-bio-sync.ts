import { fetchSltBioLinkClicks } from "@/lib/slt-bio";
import { ingestLinkClickEvents } from "@/lib/ingest/link-clicks";

export type SyncSummary = {
  fetched: number;
  matchedDays: number;
  unmatchedDays: number;
  unmatchedPageSlugs: string[];
  partialFetchError: string | null;
};
export type SyncResult = { error: string } | { summary: SyncSummary };

/**
 * Core SLT.bio sync, shared by the manual "Jetzt synchronisieren" button
 * (short lookback, for a quick recheck) and the daily cron job (longer
 * lookback, to catch a full day in one run — Vercel's Hobby plan only
 * allows cron jobs to run once per day, so that one run has to cover the
 * whole gap since the previous one).
 */
export async function runSltBioSync(opts: {
  lookbackHours: number;
  maxPages: number;
}): Promise<SyncResult> {
  if (!process.env.SLT_BIO_API_KEY) {
    return { error: "SLT_BIO_API_KEY ist nicht konfiguriert (.env)." };
  }

  const since = new Date();
  since.setUTCHours(since.getUTCHours() - opts.lookbackHours);

  const { events, error: fetchError } = await fetchSltBioLinkClicks({
    since: since.toISOString(),
    maxPages: opts.maxPages,
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
