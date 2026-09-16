import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";
import type { AccountMetricRowInput, IngestResult } from "./types";

/**
 * Matches an account and upserts one day of account metrics. Source-agnostic —
 * see post-metrics.ts for the same note.
 */
export async function ingestAccountMetricRow(
  row: AccountMetricRowInput
): Promise<IngestResult> {
  const username = row.accountUsername?.trim();
  if (!username) {
    return { success: false, error: "account_username fehlt." };
  }

  const date = normalizeDate(row.date);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: `Ungültiges Datum: "${row.date}".` };
  }

  if (!Number.isFinite(row.followers) || row.followers < 0) {
    return { success: false, error: "followers ist keine gültige Zahl." };
  }
  if (
    row.totalViews !== null &&
    row.totalViews !== undefined &&
    (!Number.isFinite(row.totalViews) || row.totalViews < 0)
  ) {
    return { success: false, error: "total_views ist keine gültige Zahl." };
  }

  const account = await prisma.account.findUnique({ where: { username } });
  if (!account) {
    return { success: false, error: `Account "${username}" nicht gefunden.` };
  }

  const data = {
    followers: Math.round(row.followers),
    totalViews:
      row.totalViews === null || row.totalViews === undefined
        ? null
        : Math.round(row.totalViews),
  };

  await prisma.accountDailyMetric.upsert({
    where: { accountId_date: { accountId: account.id, date } },
    create: { accountId: account.id, date, ...data },
    update: data,
  });

  return { success: true };
}
