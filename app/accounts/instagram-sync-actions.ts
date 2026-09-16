"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";
import {
  fetchInstagramPostsChunk,
  fetchInstagramProfile,
  HikerApiInsufficientFundsError,
  HikerApiNotFoundError,
} from "@/lib/hiker-api";
import { syncInstagramProfile } from "@/lib/ingest/instagram-sync";
import {
  processMedia,
  runInstagramAccountSync,
  type BatchTally,
  type InstagramSyncResult,
  type InstagramSyncSummary,
} from "@/lib/instagram-sync-run";

export type { InstagramSyncResult, InstagramSyncSummary };

/** Routine sync: latest 30 reels. This is what the account page's sync button runs. */
export async function syncInstagramAccount(
  accountId: string
): Promise<InstagramSyncResult> {
  const result = await runInstagramAccountSync(accountId);
  if ("summary" in result) {
    revalidatePath(`/accounts/${accountId}`);
    revalidatePath(`/accounts/${accountId}/posts`);
    revalidatePath("/creators");
  }
  return result;
}

export type FullSyncSummary = {
  reelsScraped: number;
  reelsCreated: number;
  skippedNonReels: number;
  pagesFetched: number;
};
export type FullSyncResult = { error: string } | { summary: FullSyncSummary };

const FULL_SYNC_MAX_PAGES = 50;

/**
 * On-demand full backfill: pages through the account's entire media history
 * via the cursor-paginated endpoint. Deliberately NOT part of the routine
 * sync — this is for the rare "find an old viral Reel" case, triggered only
 * from the full-account view, so it doesn't add cost/latency to the every-
 * day sync path.
 */
export async function syncAllInstagramReels(accountId: string): Promise<FullSyncResult> {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return { error: "Account nicht gefunden." };
  }

  try {
    const profile = await fetchInstagramProfile(account.username);
    const today = normalizeDate(new Date().toISOString());
    await syncInstagramProfile(accountId, profile, today);

    const tally: BatchTally = { reelsScraped: 0, reelsCreated: 0, skippedNonReels: 0 };
    let cursor: string | undefined;
    let pagesFetched = 0;

    for (let page = 0; page < FULL_SYNC_MAX_PAGES; page++) {
      const { items, nextCursor } = await fetchInstagramPostsChunk(String(profile.pk), cursor);
      pagesFetched++;
      for (const media of items) {
        await processMedia(accountId, media, today, tally);
      }
      if (!nextCursor || items.length === 0) break;
      cursor = nextCursor;
    }

    revalidatePath(`/accounts/${accountId}`);
    revalidatePath(`/accounts/${accountId}/posts`);
    revalidatePath("/creators");
    return { summary: { ...tally, pagesFetched } };
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
