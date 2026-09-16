import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";
import type { IngestResult, PostMetricRowInput } from "./types";

const REQUIRED_NUMERIC_FIELDS = ["views", "likes", "comments"] as const;
const OPTIONAL_NUMERIC_FIELDS = ["shares", "saves"] as const;

/**
 * Matches an account + post and upserts one day of post metrics. Source-agnostic:
 * called today from the CSV importer, and later can be called the same way
 * from a scheduled API sync — only the caller that produces `row` changes.
 */
export async function ingestPostMetricRow(
  row: PostMetricRowInput
): Promise<IngestResult> {
  const username = row.accountUsername?.trim();
  if (!username) {
    return { success: false, error: "account_username fehlt." };
  }

  const postUrl = row.postUrl?.trim() || null;
  const postExternalId = row.postExternalId?.trim() || null;
  if (!postUrl && !postExternalId) {
    return {
      success: false,
      error: "post_url oder post_external_id ist erforderlich.",
    };
  }

  const date = normalizeDate(row.date);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: `Ungültiges Datum: "${row.date}".` };
  }

  for (const field of REQUIRED_NUMERIC_FIELDS) {
    const value = row[field];
    if (!Number.isFinite(value) || value < 0) {
      return { success: false, error: `${field} ist keine gültige Zahl.` };
    }
  }
  for (const field of OPTIONAL_NUMERIC_FIELDS) {
    const value = row[field];
    if (value !== null && value !== undefined && (!Number.isFinite(value) || value < 0)) {
      return { success: false, error: `${field} ist keine gültige Zahl.` };
    }
  }

  const account = await prisma.account.findUnique({ where: { username } });
  if (!account) {
    return { success: false, error: `Account "${username}" nicht gefunden.` };
  }

  const post = await prisma.post.findFirst({
    where: {
      accountId: account.id,
      ...(postExternalId ? { externalPostId: postExternalId } : { url: postUrl! }),
    },
  });
  if (!post) {
    const identifier = postExternalId
      ? `external_id "${postExternalId}"`
      : `url "${postUrl}"`;
    return {
      success: false,
      error: `Post mit ${identifier} nicht gefunden für Account "${username}".`,
    };
  }

  const data = {
    views: Math.round(row.views),
    likes: Math.round(row.likes),
    comments: Math.round(row.comments),
    shares: row.shares === null || row.shares === undefined ? null : Math.round(row.shares),
    saves: row.saves === null || row.saves === undefined ? null : Math.round(row.saves),
  };

  await prisma.postDailyMetric.upsert({
    where: { postId_date: { postId: post.id, date } },
    create: { postId: post.id, date, ...data },
    update: data,
  });

  return { success: true };
}
