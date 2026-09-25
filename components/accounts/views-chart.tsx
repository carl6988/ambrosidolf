"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { updateAccountChartSettings } from "@/app/accounts/actions";

export type ProfileSeries = {
  accountId: string;
  label: string;
  color: string;
  visible: boolean;
};

export type DataPoint = {
  date: string;
  timestamp: number;
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
  const visibleProfiles = profiles?.filter((p) => p.visible) ?? [];

  return (
    <div className="rounded-[var(--radius)] border border-border bg-popover p-3 text-popover-foreground shadow-sm">
      <p className="text-sm font-medium">{formatDateShort(Number(label))}</p>
      {viewsEntry && (
        <p className="mt-1 text-sm">{formatNumber(Number(viewsEntry.value))} Views</p>
      )}
      {visibleProfiles.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {visibleProfiles.map((p) => {
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

function ProfileLegend({ profiles }: { profiles: ProfileSeries[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function toggleVisible(accountId: string, visible: boolean) {
    startTransition(async () => {
      await updateAccountChartSettings(accountId, { showInChart: visible });
      router.refresh();
    });
  }

  function changeColor(accountId: string, color: string) {
    startTransition(async () => {
      await updateAccountChartSettings(accountId, { chartColor: color });
      router.refresh();
    });
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {profiles.map((p) => (
        <label
          key={p.accountId}
          className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground"
        >
          <input
            type="checkbox"
            checked={p.visible}
            onChange={(e) => toggleVisible(p.accountId, e.target.checked)}
            className="h-3 w-3 cursor-pointer accent-primary"
          />
          <input
            type="color"
            value={p.color}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => changeColor(p.accountId, e.target.value)}
            title={`Farbe für ${p.label}`}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded-full border-none bg-transparent p-0"
          />
          <span className={p.visible ? "" : "line-through opacity-60"}>{p.label}</span>
        </label>
      ))}
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: MISSING_POSTS_COLOR }}
        />
        Posts-Ziel verfehlt
      </span>
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

  const visibleProfiles = profiles?.filter((p) => p.visible) ?? [];

  // Bars are centered on their day's x position, so the first/last day's
  // bar cluster would otherwise overflow past the plot edges (over the
  // Y-axis labels on the left, clipped by the card on the right). Reserve
  // exactly half a cluster's width as XAxis padding on each side so
  // everything stays inside the plot regardless of how many profiles are
  // currently visible.
  const barSize = 10;
  const barGap = 3;
  const clusterWidth =
    visibleProfiles.length > 0
      ? visibleProfiles.length * barSize + Math.max(0, visibleProfiles.length - 1) * barGap
      : 0;
  const edgePadding = clusterWidth > 0 ? clusterWidth / 2 + 6 : 4;

  return (
    <div>
      {profiles && profiles.length > 0 && <ProfileLegend profiles={profiles} />}
      <ResponsiveContainer width="100%" height={256}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barGap={barGap}
        >
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={data.map((d) => d.timestamp)}
            tickFormatter={(value: number) => formatDateShort(value)}
            padding={{ left: edgePadding, right: edgePadding }}
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
          {visibleProfiles.length > 0 && (
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} hide />
          )}
          <Tooltip
            content={(props) => <ChartTooltip {...props} profiles={profiles} />}
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
          />
          {visibleProfiles.map((p) => (
            <Bar
              key={`${p.accountId}-done`}
              yAxisId="pct"
              dataKey={`${p.accountId}_donePct`}
              stackId={p.accountId}
              fill={p.color}
              barSize={barSize}
            />
          ))}
          {visibleProfiles.map((p) => (
            <Bar
              key={`${p.accountId}-missing`}
              yAxisId="pct"
              dataKey={`${p.accountId}_missingPct`}
              stackId={p.accountId}
              fill={MISSING_POSTS_COLOR}
              barSize={barSize}
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
