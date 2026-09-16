import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PostMetricsChart } from "@/components/posts/post-metrics-chart";
import { AddPostSnapshotDialog } from "@/components/posts/add-post-snapshot-dialog";

const MEDIA_TYPE_LABEL: Record<string, string> = {
  REEL: "Reel",
  PHOTO: "Photo",
  CAROUSEL: "Carousel",
};

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export default async function PostDetailPage({
  params,
}: {
  params: { id: string; postId: string };
}) {
  const post = await prisma.post.findUnique({
    where: { id: params.postId },
    include: {
      account: true,
      dailyMetrics: { orderBy: { date: "asc" } },
    },
  });

  if (!post || post.accountId !== params.id) notFound();

  const chartData = post.dailyMetrics.map((m) => ({
    date: m.date.toISOString(),
    views: m.views,
    likes: m.likes,
    comments: m.comments,
    shares: m.shares ?? 0,
    saves: m.saves ?? 0,
  }));

  const today = todayUTC();
  const todaysMetric =
    post.dailyMetrics.find((m) => m.date.getTime() === today.getTime()) ??
    null;

  return (
    <div className="p-8">
      <Link
        href={`/accounts/${post.account.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu {post.account.displayName}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {post.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.thumbnailUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-lg bg-muted" />
          )}
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{MEDIA_TYPE_LABEL[post.mediaType]}</span>
              <span>·</span>
              <span>{formatDate(post.postedAt)}</span>
            </div>
            <h1 className="mt-1 max-w-xl text-lg font-semibold leading-snug tracking-tight">
              {post.caption || post.url}
            </h1>
            <a
              href={post.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Original-Post öffnen
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
        <AddPostSnapshotDialog postId={post.id} todaysMetric={todaysMetric} />
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Verlauf seit Veröffentlichung
          </h2>
          <PostMetricsChart data={chartData} />
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">Snapshots</h2>
      </div>

      <div className="mt-4 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Likes</TableHead>
              <TableHead className="text-right">Kommentare</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Saves</TableHead>
              <TableHead className="text-right">Engagement</TableHead>
              <TableHead className="text-right">Save Rate</TableHead>
              <TableHead className="text-right">Comment Rate</TableHead>
              <TableHead className="text-right">Share Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {post.dailyMetrics.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-sm text-muted-foreground"
                >
                  Noch keine Snapshots erfasst.
                </TableCell>
              </TableRow>
            )}
            {[...post.dailyMetrics]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .map((metric) => {
                const engagement =
                  metric.likes +
                  metric.comments +
                  (metric.shares ?? 0) +
                  (metric.saves ?? 0);
                return (
                  <TableRow key={metric.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(metric.date)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(metric.views)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(metric.likes)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(metric.comments)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(metric.shares)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(metric.saves)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(engagement, metric.views)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(metric.saves, metric.views)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(metric.comments, metric.views)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPercent(metric.shares, metric.views)}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
