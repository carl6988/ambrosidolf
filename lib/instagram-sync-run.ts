import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";
import {
  fetchInstagramMediaDetail,
  fetchInstagramPosts,
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

/**
 * Routine sync for one account: latest 30 reels. Shared by the account
 * page's manual button and the daily cron job that loops over every
 * account — same core, same behavior either way.
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

    const posts = await fetchInstagramPosts(String(profile.pk));

    const tally: BatchTally = { reelsScraped: 0, reelsCreated: 0, skippedNonReels: 0 };
    for (const media of posts) {
      await processMedia(accountId, media, today, tally);
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
