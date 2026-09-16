import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runInstagramAccountSync } from "@/lib/instagram-sync-run";

// Runs the routine (latest-30-reels) sync for every account, once a day —
// same per-account logic as the manual "Von Instagram synchronisieren"
// button. Sequential on purpose: HikerAPI is pay-per-request, so this
// avoids bursting many concurrent calls at once. With a handful of
// accounts this comfortably fits the duration budget below; if the
// account list grows a lot, this would need batching/parallelism instead.
export const maxDuration = 280;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    select: { id: true, username: true },
  });

  const results: {
    username: string;
    ok: boolean;
    error?: string;
    reelsScraped?: number;
    reelsCreated?: number;
  }[] = [];

  for (const account of accounts) {
    const result = await runInstagramAccountSync(account.id);
    if ("error" in result) {
      results.push({ username: account.username, ok: false, error: result.error });
    } else {
      results.push({
        username: account.username,
        ok: true,
        reelsScraped: result.summary.reelsScraped,
        reelsCreated: result.summary.reelsCreated,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    accountsProcessed: results.length,
    results,
  });
}
