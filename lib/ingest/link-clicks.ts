import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";

export type LinkClickEventInput = {
  pageSlug: string;
  createdAt: string;
  sessionId: string | null;
};

type DayGroup = {
  pageSlug: string;
  date: Date;
  clicks: number;
  uniqueSessionIds: Set<string>;
};

export type IngestLinkClicksSummary = {
  matchedDays: number;
  unmatchedDays: number;
  unmatchedPageSlugs: string[];
};

/**
 * Aggregates raw click events into per-(page, day) totals and upserts them
 * as LinkClickImport rows. Source-agnostic like the other ingest functions —
 * today the events come from the SLT.bio API sync, but nothing here assumes
 * that transport.
 *
 * Matched accounts (Account.sltBioPageSlug === event.pageSlug) are upserted
 * idempotently, so re-running a sync over an overlapping time window is
 * safe. Unmatched page slugs are inserted as accountId=null rows for manual
 * review/connection, same as the CSV import path.
 */
export async function ingestLinkClickEvents(
  events: LinkClickEventInput[],
  source: string
): Promise<IngestLinkClicksSummary> {
  const groups = new Map<string, DayGroup>();

  for (const event of events) {
    const date = normalizeDate(event.createdAt);
    const key = `${event.pageSlug}::${date.toISOString()}`;
    let group = groups.get(key);
    if (!group) {
      group = { pageSlug: event.pageSlug, date, clicks: 0, uniqueSessionIds: new Set() };
      groups.set(key, group);
    }
    group.clicks++;
    if (event.sessionId) group.uniqueSessionIds.add(event.sessionId);
  }

  let matchedDays = 0;
  let unmatchedDays = 0;
  const unmatchedPageSlugs = new Set<string>();

  for (const group of Array.from(groups.values())) {
    const account = await prisma.account.findFirst({
      where: { sltBioPageSlug: group.pageSlug },
      select: { id: true },
    });

    const rawPayload = JSON.stringify({ pageSlug: group.pageSlug });
    const clicks = group.clicks;
    const uniqueClicks = group.uniqueSessionIds.size;

    if (account) {
      await prisma.linkClickImport.upsert({
        where: {
          accountId_date_source: {
            accountId: account.id,
            date: group.date,
            source,
          },
        },
        create: {
          accountId: account.id,
          date: group.date,
          clicks,
          uniqueClicks,
          source,
          rawPayload,
        },
        update: { clicks, uniqueClicks, rawPayload },
      });
      matchedDays++;
    } else {
      await prisma.linkClickImport.create({
        data: {
          accountId: null,
          date: group.date,
          clicks,
          uniqueClicks,
          source,
          rawPayload,
        },
      });
      unmatchedDays++;
      unmatchedPageSlugs.add(group.pageSlug);
    }
  }

  return {
    matchedDays,
    unmatchedDays,
    unmatchedPageSlugs: Array.from(unmatchedPageSlugs),
  };
}

export type LinkClickImportRowInput = {
  accountUsername?: string | null;
  postUrl?: string | null;
  date: string;
  clicks: number;
  uniqueClicks?: number | null;
};

export type IngestRowResult =
  | { success: true; matched: boolean }
  | { success: false; error: string };

/**
 * Ingests one pre-aggregated daily row (e.g. from a CSV upload), as opposed
 * to raw click events. Per spec: an unresolvable account/post is not an
 * error — the row is still saved with accountId/postId = null for manual
 * review, matching the CSV-import stub behavior.
 */
export async function ingestLinkClickImportRow(
  row: LinkClickImportRowInput,
  source: string
): Promise<IngestRowResult> {
  const date = normalizeDate(row.date);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: `Ungültiges Datum: "${row.date}".` };
  }
  if (!Number.isFinite(row.clicks) || row.clicks < 0) {
    return { success: false, error: "clicks ist keine gültige Zahl." };
  }
  if (
    row.uniqueClicks !== null &&
    row.uniqueClicks !== undefined &&
    (!Number.isFinite(row.uniqueClicks) || row.uniqueClicks < 0)
  ) {
    return { success: false, error: "unique_clicks ist keine gültige Zahl." };
  }

  let accountId: string | null = null;
  let postId: string | null = null;

  if (row.postUrl) {
    const post = await prisma.post.findFirst({ where: { url: row.postUrl } });
    if (post) {
      postId = post.id;
      accountId = post.accountId;
    }
  }
  if (!accountId && row.accountUsername) {
    const account = await prisma.account.findUnique({
      where: { username: row.accountUsername },
    });
    if (account) accountId = account.id;
  }

  await prisma.linkClickImport.create({
    data: {
      accountId,
      postId,
      date,
      clicks: Math.round(row.clicks),
      uniqueClicks:
        row.uniqueClicks === null || row.uniqueClicks === undefined
          ? null
          : Math.round(row.uniqueClicks),
      source,
      rawPayload: JSON.stringify({
        accountUsername: row.accountUsername ?? null,
        postUrl: row.postUrl ?? null,
      }),
    },
  });

  return { success: true, matched: accountId !== null };
}
