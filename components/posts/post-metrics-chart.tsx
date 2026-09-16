"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateShort, formatNumber } from "@/lib/format";

type DataPoint = {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

const SERIES: {
  key: keyof Omit<DataPoint, "date">;
  label: string;
  color: string;
  axis: "left" | "right";
}[] = [
  { key: "views", label: "Views", color: "hsl(var(--chart-1))", axis: "left" },
  { key: "likes", label: "Likes", color: "hsl(var(--chart-2))", axis: "right" },
  {
    key: "comments",
    label: "Kommentare",
    color: "hsl(var(--chart-3))",
    axis: "right",
  },
  { key: "shares", label: "Shares", color: "hsl(var(--chart-4))", axis: "right" },
  { key: "saves", label: "Saves", color: "hsl(var(--chart-5))", axis: "right" },
];

export function PostMetricsChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
        Noch keine Snapshots erfasst.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
          yAxisId="left"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatNumber(value)}
          width={64}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => formatNumber(value)}
          width={56}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            color: "hsl(var(--popover-foreground))",
          }}
          labelFormatter={(label) => formatDateShort(String(label))}
          formatter={(value, name) => [formatNumber(Number(value)), String(name)]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
        {SERIES.map((s) => (
          <Line
            key={s.key}
            yAxisId={s.axis}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
