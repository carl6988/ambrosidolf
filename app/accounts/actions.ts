"use server";

import { revalidatePath } from "next/cache";
import { Prisma, MediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";

type ActionResult = { error?: string; success?: true };

export async function createAccount(
  formData: FormData
): Promise<ActionResult> {
  const creatorId = String(formData.get("creatorId") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const profileUrl = String(formData.get("profileUrl") ?? "").trim();

  if (!creatorId || !username || !displayName || !profileUrl) {
    return { error: "Bitte alle Felder ausfüllen." };
  }

  try {
    await prisma.account.create({
      data: { creatorId, username, displayName, profileUrl },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: `Username "${username}" existiert bereits.` };
    }
    return { error: "Account konnte nicht angelegt werden." };
  }

  revalidatePath(`/creators/${creatorId}`);
  return { success: true };
}

export async function updateAccountSltBio(
  formData: FormData
): Promise<ActionResult> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  const rawInput = String(formData.get("sltBioPageSlug") ?? "").trim();

  if (!accountId) {
    return { error: "Account fehlt." };
  }

  // Accept either a bare slug ("my-page") or a full slt.bio URL
  // ("https://slt.bio/my-page") and normalize down to the slug.
  let slug = rawInput || null;
  if (slug) {
    try {
      const url = new URL(slug);
      slug = url.pathname.replace(/^\/+|\/+$/g, "");
    } catch {
      // not a URL, treat rawInput as the slug itself
    }
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { creatorId: true },
  });
  if (!account) {
    return { error: "Account nicht gefunden." };
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { sltBioPageSlug: slug },
  });

  revalidatePath(`/accounts/${accountId}`);
  revalidatePath(`/creators/${account.creatorId}`);
  return { success: true };
}

export async function createPost(formData: FormData): Promise<ActionResult> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const captionRaw = String(formData.get("caption") ?? "").trim();
  const mediaType = String(formData.get("mediaType") ?? "").trim();
  const postedAtStr = String(formData.get("postedAt") ?? "").trim();
  const thumbnailUrlRaw = String(formData.get("thumbnailUrl") ?? "").trim();

  if (!accountId || !url || !postedAtStr) {
    return { error: "Bitte URL und Veröffentlichungsdatum angeben." };
  }
  if (!Object.values(MediaType).includes(mediaType as MediaType)) {
    return { error: "Ungültiger Medientyp." };
  }

  const postedAt = new Date(postedAtStr);
  if (Number.isNaN(postedAt.getTime())) {
    return { error: "Ungültiges Datum." };
  }

  try {
    await prisma.post.create({
      data: {
        accountId,
        url,
        caption: captionRaw || null,
        mediaType: mediaType as MediaType,
        postedAt,
        thumbnailUrl: thumbnailUrlRaw || null,
      },
    });
  } catch {
    return { error: "Post konnte nicht angelegt werden." };
  }

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}

export async function upsertAccountDailyMetric(
  formData: FormData
): Promise<ActionResult> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "").trim();
  const followersRaw = String(formData.get("followers") ?? "").trim();
  const totalViewsRaw = String(formData.get("totalViews") ?? "").trim();

  if (!accountId || !dateStr || !followersRaw) {
    return { error: "Bitte Datum und Follower angeben." };
  }

  const followers = Number(followersRaw);
  if (!Number.isInteger(followers) || followers < 0) {
    return { error: "Follower muss eine positive Ganzzahl sein." };
  }

  const totalViews = totalViewsRaw ? Number(totalViewsRaw) : null;
  if (totalViews !== null && (!Number.isInteger(totalViews) || totalViews < 0)) {
    return { error: "Views muss eine positive Ganzzahl sein." };
  }

  const date = normalizeDate(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { error: "Ungültiges Datum." };
  }

  try {
    await prisma.accountDailyMetric.upsert({
      where: { accountId_date: { accountId, date } },
      create: { accountId, date, followers, totalViews },
      update: { followers, totalViews },
    });
  } catch {
    return { error: "Tageswerte konnten nicht gespeichert werden." };
  }

  revalidatePath(`/accounts/${accountId}`);
  revalidatePath("/accounts");
  return { success: true };
}

const REQUIRED_POST_METRIC_FIELDS = ["views", "likes", "comments"] as const;
const OPTIONAL_POST_METRIC_FIELDS = ["shares", "saves"] as const;

export async function upsertPostDailyMetric(
  formData: FormData
): Promise<ActionResult> {
  const postId = String(formData.get("postId") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "").trim();

  if (!postId || !dateStr) {
    return { error: "Bitte Datum angeben." };
  }

  const values: Record<(typeof REQUIRED_POST_METRIC_FIELDS)[number], number> & {
    shares: number | null;
    saves: number | null;
  } = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: null,
    saves: null,
  };

  for (const field of REQUIRED_POST_METRIC_FIELDS) {
    const raw = String(formData.get(field) ?? "").trim();
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      return { error: `${field} muss eine positive Ganzzahl sein.` };
    }
    values[field] = value;
  }
  for (const field of OPTIONAL_POST_METRIC_FIELDS) {
    const raw = String(formData.get(field) ?? "").trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) {
      return { error: `${field} muss eine positive Ganzzahl sein.` };
    }
    values[field] = value;
  }

  const date = normalizeDate(dateStr);
  if (Number.isNaN(date.getTime())) {
    return { error: "Ungültiges Datum." };
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { accountId: true },
  });
  if (!post) {
    return { error: "Post nicht gefunden." };
  }

  try {
    await prisma.postDailyMetric.upsert({
      where: { postId_date: { postId, date } },
      create: { postId, date, ...values },
      update: values,
    });
  } catch {
    return { error: "Snapshot konnte nicht gespeichert werden." };
  }

  revalidatePath(`/accounts/${post.accountId}/posts/${postId}`);
  revalidatePath(`/accounts/${post.accountId}`);
  return { success: true };
}
