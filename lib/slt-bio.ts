const SLT_BIO_BASE_URL = "https://api.slt.bio/v1";

export type SltBioEvent = {
  created_at: string;
  event_type: "link_clicked" | "page_viewed" | "country_blocked" | string;
  page_slug: string;
  session_id: string | null;
};

type SltBioEventsResponse = {
  events: SltBioEvent[];
  next_since?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sltBioRequest<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const apiKey = process.env.SLT_BIO_API_KEY;
  if (!apiKey) {
    throw new Error("SLT_BIO_API_KEY ist nicht gesetzt (.env).");
  }

  const url = new URL(`${SLT_BIO_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  // The upstream API can return a transient 5xx under load — one retry
  // with a short backoff before giving up on this page.
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await sleep(500);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    if (res.ok) {
      return res.json() as Promise<T>;
    }
    lastError = new Error(`SLT.bio API Fehler ${res.status}: ${await res.text()}`);
    if (res.status < 500) break; // don't retry client errors (4xx)
  }
  throw lastError;
}

/**
 * Fetches link_clicked events since a given ISO timestamp, following the
 * API's cursor-based pagination (`next_since`) until it catches up to now
 * or hits `maxPages`. The API doesn't filter server-side by event_type, so
 * filtering happens here.
 *
 * If a page fails (even after the retry in sltBioRequest), pagination stops
 * there but events already collected are still returned — a transient
 * failure on page 20 of 25 shouldn't discard the first 19.
 */
export async function fetchSltBioLinkClicks(opts: {
  since: string;
  maxPages?: number;
}): Promise<{ events: SltBioEvent[]; pagesFetched: number; error: string | null }> {
  const maxPages = opts.maxPages ?? 25;
  let since = opts.since;
  const collected: SltBioEvent[] = [];
  let pagesFetched = 0;

  for (let page = 0; page < maxPages; page++) {
    let data: SltBioEventsResponse;
    try {
      data = await sltBioRequest<SltBioEventsResponse>("/events", { since });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unbekannter Fehler.";
      return { events: collected, pagesFetched, error: message };
    }
    pagesFetched++;

    const events = data.events ?? [];
    for (const e of events) {
      if (e.event_type === "link_clicked") collected.push(e);
    }

    if (!data.next_since || data.next_since === since || events.length === 0) {
      break;
    }
    since = data.next_since;
  }

  return { events: collected, pagesFetched, error: null };
}
