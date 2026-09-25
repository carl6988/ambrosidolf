const HIKER_API_BASE_URL = "https://api.hikerapi.com";

// Field names verified against the live OpenAPI spec at
// https://api.hikerapi.com/openapi.json (HikerAPI REST v1.8.1) AND against
// live responses (the spec and reality don't fully agree — see notes below).
// media_type follows Instagram's long-standing convention (1 = photo,
// 2 = video, 8 = carousel), which HikerAPI passes through as-is.
export type HikerUser = {
  // Live response returns this as a JSON number, despite the OpenAPI spec
  // declaring it a string. Nested user objects elsewhere DO return it as a
  // string. Typed loosely here; always String(...) it before use.
  pk: number | string;
  username: string;
  full_name: string | null;
  follower_count: number;
  following_count: number;
  media_count: number;
  profile_pic_url: string | null;
  is_private: boolean;
};

export type HikerMedia = {
  pk: string;
  id: string;
  code: string;
  media_type: number;
  product_type: string | null;
  caption_text: string | null;
  taken_at: string;
  thumbnail_url: string | null;
  like_count: number;
  comment_count: number;
  // Both reported as 0 by the /v1/user/medias LIST endpoint even for posts
  // with millions of real views — that endpoint just doesn't populate them.
  // Accurate values only come from the single-media detail endpoint
  // (/v1/media/by/id), confirmed live. Always re-fetch per post for views.
  view_count: number | null;
  play_count: number | null;
};

class HikerApiError extends Error {}
export class HikerApiInsufficientFundsError extends HikerApiError {}
export class HikerApiNotFoundError extends HikerApiError {}

async function hikerRequest<T>(
  path: string,
  params: Record<string, string>
): Promise<T> {
  const apiKey = process.env.HIKER_API_KEY;
  if (!apiKey) {
    throw new HikerApiError("HIKER_API_KEY ist nicht gesetzt (.env).");
  }

  const url = new URL(`${HIKER_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { "x-access-key": apiKey },
    cache: "no-store",
  });

  if (res.status === 402) {
    throw new HikerApiInsufficientFundsError(
      "HikerAPI-Guthaben aufgebraucht — auf https://hikerapi.com/billing aufladen."
    );
  }
  if (res.status === 404) {
    throw new HikerApiNotFoundError(`Nicht gefunden: ${path}`);
  }
  if (!res.ok) {
    throw new HikerApiError(`HikerAPI Fehler ${res.status}: ${await res.text()}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchInstagramProfile(username: string): Promise<HikerUser> {
  return hikerRequest<HikerUser>("/v1/user/by/username", { username });
}

/**
 * Fetches accurate view/play counts for one post. Needed because the list
 * endpoint's view_count/play_count are unreliable (see HikerMedia notes).
 */
export async function fetchInstagramMediaDetail(mediaId: string): Promise<HikerMedia> {
  return hikerRequest<HikerMedia>("/v1/media/by/id", { id: mediaId });
}

/**
 * One page of the cursor-paginated media list — confirmed live to return a
 * 2-tuple [items, nextCursor], matching the OpenAPI spec exactly (unlike
 * some other fields). nextCursor is null once there's nothing more to page.
 * Used by both the routine 30-day sync (lib/instagram-sync-run.ts, bounded
 * by a date cutoff) and the on-demand full backfill ("Ganzen Account
 * laden", bounded by a page count) — each page costs one request.
 */
export async function fetchInstagramPostsChunk(
  userId: string,
  endCursor?: string
): Promise<{ items: HikerMedia[]; nextCursor: string | null }> {
  const params: Record<string, string> = { user_id: String(userId) };
  if (endCursor) params.end_cursor = endCursor;
  const [items, nextCursor] = await hikerRequest<[HikerMedia[], string | null]>(
    "/v1/user/medias/chunk",
    params
  );
  return { items: Array.isArray(items) ? items : [], nextCursor };
}
