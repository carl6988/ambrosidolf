export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatPercent(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): string {
  if (
    numerator === null ||
    numerator === undefined ||
    !denominator ||
    denominator === 0
  ) {
    return "–";
  }
  const pct = (numerator / denominator) * 100;
  return `${pct.toFixed(2).replace(".", ",")}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: Date | string | number): string {
  const d = typeof date === "object" ? date : new Date(date);
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

export function formatDelta(value: number | null | undefined): string {
  if (value === null || value === undefined) return "–";
  if (value === 0) return "±0";
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatNumber(Math.abs(value))}`;
}

export function toDateInputValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
