// Stable color assignment for per-profile chart overlays (e.g. the Daily
// Posts bars on the Creator overview's Views chart). Cycles if a Creator
// ever has more accounts than colors.
export const PROFILE_COLORS = [
  "#22d3ee", // cyan
  "#eab308", // yellow
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#3b82f6", // blue
  "#ec4899", // pink
  "#14b8a6", // teal
];

export function profileColor(index: number): string {
  return PROFILE_COLORS[index % PROFILE_COLORS.length];
}

// Missing-posts portion of a profile's Daily Posts bar — deliberately not
// part of the cycling palette above so it never collides with a profile
// color.
export const MISSING_POSTS_COLOR = "#ef4444";
