export type IngestResult = { success: true } | { success: false; error: string };

/**
 * Transport-agnostic row shapes. A row can come from a parsed CSV line today
 * or from an API response tomorrow — the ingest functions in this directory
 * don't care about the source, only about this normalized shape.
 */
export type PostMetricRowInput = {
  accountUsername: string;
  postUrl?: string | null;
  postExternalId?: string | null;
  date: string;
  views: number;
  likes: number;
  comments: number;
  // Instagram doesn't expose these publicly — optional since most sources
  // (including any scraping API) can't provide them.
  shares?: number | null;
  saves?: number | null;
};

export type AccountMetricRowInput = {
  accountUsername: string;
  date: string;
  followers: number;
  totalViews?: number | null;
};
