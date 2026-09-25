import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";
import {
  fetchInstagramMediaDetail,
  fetchInstagramPostsChunk,
  fetchInstagramProfile,
  HikerApiInsufficientFundsError,
  HikerApiNotFoundError,
  type HikerMedia,
} from "@/lib/hiker-api";
import { isReel, syncInstagramPost, syncInstagramProfile } from "@/lib/ingest/instagram-sync";

export type BatchTally = { reelsScraped: number; reelsCreated: number; skippedNonReels: number };

export async function processMedia(
  accountId: string,
  media: HikerMedia,
  date: Date,
  tally: BatchTally
): Promise<void> {
  // Only Reels are tracked — skip Photo/Carousel before spending an extra
  // API call on their detail fetch.
  if (!isReel(media)) {
    tally.skippedNonReels++;
    return;
  }

  // The list endpoint's view/play counts are unreliable (always 0 in
  // testing) — fetch the single-media detail for accurate numbers.
  let mediaWithViews = media;
  try {
    mediaWithViews = await fetchInstagramMediaDetail(media.pk);
  } catch {
    // Fall back to the list item (views may read as 0) rather than failing
    // the whole sync over one post's detail call.
  }
  const { created } = await syncInstagramPost(accountId, mediaWithViews, date);
  tally.reelsScraped++;
  if (created) tally.reelsCreated++;
}

export type InstagramSyncSummary = {
  followers: number;
  reelsScraped: number;
  reelsCreated: number;
  skippedNonReels: number;
};
export type InstagramSyncResult = { error: string } | { summary: InstagramSyncSummary };

// Routine sync covers the last 30 calendar days, not a fixed post count —
// a fixed "latest 30 reels" cap would under-cover a high-frequency poster
// (their 30 most recent reels might span only a week) while a low-frequency
// account could reach back months on a single page. Paginating by date
// keeps every account's chart comparable across the same date ranges.
const ROUTINE_SYNC_LOOKBACK_DAYS = 30;
// Safety cap on pages fetched per account, distinct from the on-demand full
// backfill's FULL_SYNC_MAX_PAGES=50 (app/accounts/instagram-sync-actions.ts)
// — 30 days of even a very active daily-poster account shouldn't need more
// than a handful of pages.
const ROUTINE_SYNC_MAX_PAGES = 10;

/**
 * Routine sync for one account: all reels from the last 30 days. Shared by
 * the account page's manual button, the Creator-wide sync button, and the
 * daily cron job that loops over every account — same core, same behavior
 * either way.
 */
export async function runInstagramAccountSync(
  accountId: string
): Promise<InstagramSyncResult> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return { error: "Account nicht gefunden." };
  }

  try {
    const profile = await fetchInstagramProfile(account.username);
    const today = normalizeDate(new Date().toISOString());
    await syncInstagramProfile(accountId, profile, today);

    const cutoff = new Date(today);
    cutoff.setUTCDate(cutoff.getUTCDate() - ROUTINE_SYNC_LOOKBACK_DAYS);

    const tally: BatchTally = { reelsScraped: 0, reelsCreated: 0, skippedNonReels: 0 };
    let cursor: string | undefined;
    for (let page = 0; page < ROUTINE_SYNC_MAX_PAGES; page++) {
      const { items, nextCursor } = await fetchInstagramPostsChunk(String(profile.pk), cursor);
      if (items.length === 0) break;

      for (const media of items) {
        await processMedia(accountId, media, today, tally);
      }

      // Pages come back newest-first, so once the oldest item on this page
      // is past the cutoff, every later page would be too — stop here.
      const oldest = items[items.length - 1];
      if (new Date(oldest.taken_at) < cutoff) break;
      if (!nextCursor) break;
      cursor = nextCursor;
    }

    return { summary: { followers: profile.follower_count, ...tally } };
  } catch (e) {
    if (e instanceof HikerApiInsufficientFundsError) {
      return { error: e.message };
    }
    if (e instanceof HikerApiNotFoundError) {
      return { error: `Instagram-Account "@${account.username}" nicht gefunden.` };
    }
    return { error: e instanceof Error ? e.message : "Sync fehlgeschlagen." };
  }
}
