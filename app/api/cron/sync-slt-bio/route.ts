import { NextResponse } from "next/server";
import { runSltBioSync } from "@/lib/slt-bio-sync";

// Vercel Hobby plan only allows cron jobs to run once per day (see
// vercel.json), so this one run has to cover the whole gap since the
// previous day's run. 26h (not 24h) gives a couple hours of overlap to
// absorb Hobby's imprecise cron timing (±59 min) without leaving a gap.
// Re-running over already-covered time is safe — ingestion upserts per day.
const CRON_LOOKBACK_HOURS = 26;
const CRON_MAX_PAGES = 40;

export const maxDuration = 120;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSltBioSync({
    lookbackHours: CRON_LOOKBACK_HOURS,
    maxPages: CRON_MAX_PAGES,
  });

  if ("error" in result) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
  }
  return NextResponse.json({ ok: true, summary: result.summary });
}
