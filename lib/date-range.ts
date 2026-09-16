export type RangeKey =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export type ResolvedRange = { start: Date; end: Date };

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This week" },
  { key: "last_week", label: "Last week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "custom", label: "Custom" },
];

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Monday of the ISO week containing `d`. */
function mondayOf(d: Date): Date {
  const x = startOfDayUTC(d);
  const day = x.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  return addDays(x, -daysSinceMonday);
}

export function resolveDateRange(
  key: RangeKey,
  customFrom?: string | null,
  customTo?: string | null
): ResolvedRange {
  const today = startOfDayUTC(new Date());

  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const y = addDays(today, -1);
      return { start: y, end: y };
    }
    case "this_week":
      return { start: mondayOf(today), end: today };
    case "last_week": {
      const thisMonday = mondayOf(today);
      return { start: addDays(thisMonday, -7), end: addDays(thisMonday, -1) };
    }
    case "this_month":
      return {
        start: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
        end: today,
      };
    case "last_month": {
      const firstThisMonth = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
      );
      const lastMonthEnd = addDays(firstThisMonth, -1);
      const lastMonthStart = new Date(
        Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1)
      );
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    case "custom": {
      const start = customFrom ? startOfDayUTC(new Date(customFrom)) : today;
      const end = customTo ? startOfDayUTC(new Date(customTo)) : today;
      return start.getTime() <= end.getTime() ? { start, end } : { start: end, end: start };
    }
  }
}
