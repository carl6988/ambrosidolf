"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { runInstagramAccountSync } from "@/lib/instagram-sync-run";

export type CreatorSyncSummary = {
  accountsSynced: number;
  accountsFailed: number;
  reelsScraped: number;
  reelsCreated: number;
};
export type CreatorSyncResult = { error: string } | { summary: CreatorSyncSummary };

/**
 * Syncs every Account belonging to a Creator, sequentially (same
 * pay-per-request-friendly reasoning as the daily cron — see
 * app/api/cron/sync-instagram/route.ts). Used by both the manual
 * "Von Instagram synchronisieren" button on the Creator overview page and
 * the auto-sync-on-visit banner.
 */
export async function syncInstagramForCreator(
  creatorId: string
): Promise<CreatorSyncResult> {
  const accounts = await prisma.account.findMany({
    where: { creatorId },
    select: { id: true },
  });
  if (accounts.length === 0) {
    return { error: "Keine Accounts für diesen Creator." };
  }

  let accountsSynced = 0;
  let accountsFailed = 0;
  let reelsScraped = 0;
  let reelsCreated = 0;

  for (const account of accounts) {
    const result = await runInstagramAccountSync(account.id);
    if ("error" in result) {
      accountsFailed++;
    } else {
      accountsSynced++;
      reelsScraped += result.summary.reelsScraped;
      reelsCreated += result.summary.reelsCreated;
    }
  }

  revalidatePath(`/creators/${creatorId}`);
  revalidatePath(`/creators/${creatorId}/management`);
  revalidatePath("/creators");

  if (accountsSynced === 0) {
    return { error: "Synchronisierung ist für keinen Account gelungen." };
  }
  return { summary: { accountsSynced, accountsFailed, reelsScraped, reelsCreated } };
}
