import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import type { HikerMedia, HikerUser } from "@/lib/hiker-api";

function mapMediaType(media: HikerMedia): MediaType {
  // Instagram's standard media_type convention: 1 = photo, 2 = video, 8 =
  // carousel. Our schema has no plain "video" bucket — any non-carousel
  // video is treated as a Reel, which covers the vast majority of real
  // video posts today.
  if (media.media_type === 8) return MediaType.CAROUSEL;
  if (media.media_type === 1) return MediaType.PHOTO;
  return MediaType.REEL;
}

/** Checked before spending an extra detail-fetch API call on a post we'd skip anyway. */
export function isReel(media: HikerMedia): boolean {
  return mapMediaType(media) === MediaType.REEL;
}

function buildPostUrl(media: HikerMedia, mediaType: MediaType): string {
  const segment = mediaType === MediaType.REEL ? "reel" : "p";
  return `https://www.instagram.com/${segment}/${media.code}/`;
}

/**
 * Upserts today's AccountDailyMetric from a scraped profile. Source-agnostic
 * like the other ingest functions — HikerAPI today, potentially a different
 * scraper or the official Graph API later.
 */
export async function syncInstagramProfile(
  accountId: string,
  profile: HikerUser,
  date: Date
): Promise<void> {
  await prisma.accountDailyMetric.upsert({
    where: { accountId_date: { accountId, date } },
    create: { accountId, date, followers: profile.follower_count, totalViews: null },
    update: { followers: profile.follower_count },
  });
}

/**
 * Upserts a Post (creating it if this is the first time we've seen this
 * externalPostId for the account — i.e. actual post discovery, not just a
 * metric refresh) and today's PostDailyMetric snapshot for it.
 * shares/saves are left null: Instagram doesn't expose them publicly.
 *
 * Only Reels are tracked — Photo and Carousel posts are skipped entirely
 * (not created, not updated) per policy.
 */
export async function syncInstagramPost(
  accountId: string,
  media: HikerMedia,
  date: Date
): Promise<{ created: boolean; skipped: boolean }> {
  const mediaType = mapMediaType(media);
  if (mediaType !== MediaType.REEL) {
    return { created: false, skipped: true };
  }
  const url = buildPostUrl(media, mediaType);
  // Not `a ?? b ?? 0`: view_count is often a real 0 (not null) while
  // play_count holds the actual number, e.g. for Reels — nullish
  // coalescing would stop at that legitimate-looking 0 and never look at
  // play_count. Take whichever is larger instead.
  const views = Math.max(media.view_count ?? 0, media.play_count ?? 0);

  let created = false;
  const existing = await prisma.post.findUnique({
    where: { accountId_externalPostId: { accountId, externalPostId: media.pk } },
  });
  created = !existing;

  const post = await prisma.post.upsert({
    where: { accountId_externalPostId: { accountId, externalPostId: media.pk } },
    create: {
      accountId,
      externalPostId: media.pk,
      url,
      caption: media.caption_text || null,
      mediaType,
      postedAt: new Date(media.taken_at),
      thumbnailUrl: media.thumbnail_url,
    },
    update: {
      url,
      caption: media.caption_text || null,
      thumbnailUrl: media.thumbnail_url,
    },
  });

  await prisma.postDailyMetric.upsert({
    where: { postId_date: { postId: post.id, date } },
    create: {
      postId: post.id,
      date,
      views,
      likes: media.like_count,
      comments: media.comment_count,
      shares: null,
      saves: null,
    },
    update: {
      views,
      likes: media.like_count,
      comments: media.comment_count,
    },
  });

  return { created, skipped: false };
}
