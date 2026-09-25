"use client";

import {
  Bar,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { formatDateShort, formatNumber } from "@/lib/format";
import { MISSING_POSTS_COLOR } from "@/lib/profile-colors";

export type ProfileSeries = {
  accountId: string;
  label: string;
  color: string;
};

export type DataPoint = {
  date: string;
  views: number | null;
  // Dynamic per-profile fields, only present when `profiles` is passed:
  // `${accountId}_donePct` / `${accountId}_missingPct` (0-100, together
  // always summing to 100 when that profile has a Daily Posts Plan > 0).
  [key: string]: number | string | null;
};

function ChartTooltip({
  active,
  payload,
  label,
  profiles,
}: TooltipContentProps & { profiles?: ProfileSeries[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const viewsEntry = payload.find((p) => p.dataKey === "views");

  return (
    <div className="rounded-[var(--radius)] border border-border bg-popover p-3 text-popover-foreground shadow-sm">
      <p className="text-sm font-medium">{formatDateShort(String(label))}</p>
      {viewsEntry && (
        <p className="mt-1 text-sm">{formatNumber(Number(viewsEntry.value))} Views</p>
      )}
      {profiles && profiles.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {profiles.map((p) => {
            const row = payload[0]?.payload as Record<string, number> | undefined;
            const donePct = row?.[`${p.accountId}_donePct`];
            const missingPct = row?.[`${p.accountId}_missingPct`];
            if (donePct === undefined && missingPct === undefined) return null;
            const pct = Math.round(donePct ?? 0);
            return (
              <p key={p.accountId} className="flex items-center gap-1.5 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-muted-foreground">{p.label}</span>
                <span className="ml-auto tabular-nums">{pct}% Posts-Ziel</span>
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ViewsChart({
  data,
  profiles,
}: {
  data: DataPoint[];
  profiles?: ProfileSeries[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Noch keine Tageswerte erfasst.
      </div>
    );
  }

  return (
    <div>
      {profiles && profiles.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {profiles.map((p) => (
            <span key={p.accountId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: MISSING_POSTS_COLOR }}
            />
            Posts-Ziel verfehlt
          </span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={256}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => formatDateShort(value)}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="views"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => formatNumber(value)}
            width={64}
          />
          {profiles && profiles.length > 0 && (
            <YAxis yAxisId="pct" domain={[0, 100]} hide />
          )}
          <Tooltip
            content={(props) => <ChartTooltip {...props} profiles={profiles} />}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
          />
          {profiles?.map((p) => (
            <Bar
              key={`${p.accountId}-done`}
              yAxisId="pct"
              dataKey={`${p.accountId}_donePct`}
              stackId={p.accountId}
              fill={p.color}
              maxBarSize={14}
            />
          ))}
          {profiles?.map((p) => (
            <Bar
              key={`${p.accountId}-missing`}
              yAxisId="pct"
              dataKey={`${p.accountId}_missingPct`}
              stackId={p.accountId}
              fill={MISSING_POSTS_COLOR}
              maxBarSize={14}
            />
          ))}
          <Line
            yAxisId="views"
            type="monotone"
            dataKey="views"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
