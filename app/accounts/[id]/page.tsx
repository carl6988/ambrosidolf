import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDelta, formatNumber } from "@/lib/format";
import { RANGE_OPTIONS, resolveDateRange, type RangeKey } from "@/lib/date-range";
import { normalizeDate } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ViewsChart } from "@/components/accounts/views-chart";
import { PostsTable, type PostTableRow } from "@/components/accounts/posts-table";
import { AddAccountMetricDialog } from "@/components/accounts/add-account-metric-dialog";
import { ConnectSltBioDialog } from "@/components/accounts/connect-slt-bio-dialog";
import { SyncInstagramButton } from "@/components/accounts/sync-instagram-button";
import { syncInstagramAccount } from "@/app/accounts/instagram-sync-actions";
import { AutoSyncOnMount } from "@/components/shared/auto-sync-on-mount";
import { StatsRangePicker } from "@/components/accounts/stats-range-picker";
import { PostsTargetValue } from "@/components/accounts/posts-target-value";

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { range?: string; from?: string; to?: string };
}) {
  // Defaults to "this week" rather than "today": right after a sync there's
  // usually only a single day's data point, so deltas and "reels in range"
  // read as empty — a full week almost always has something to show.
  const rangeKey: RangeKey = isRangeKey(searchParams.range) ? searchParams.range : "this_week";
  const { start: rangeStart, end: rangeEnd } = resolveDateRange(
    rangeKey,
    searchParams.from,
    searchParams.to
  );
  // `rangeEnd` is midnight of the end day. AccountDailyMetric/LinkClickImport
  // dates are always midnight-normalized too, so `lte: rangeEnd` happened to
  // work for those — but Post.postedAt is a real timestamp (e.g. 20:59), so
  // `lte` on a bare midnight excluded almost every post on the end day.
  // Use an exclusive upper bound (start of the *next* day) everywhere instead.
  const rangeEndExclusive = new Date(rangeEnd);
  rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);
  const daysInRange = Math.round(
    (rangeEndExclusive.getTime() - rangeStart.getTime()) / 86_400_000
  );

  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      creator: true,
      // The Activity table below, the stats cards above, AND the chart all
      // read from this same range-filtered query — up to 30 reels are kept
      // synced in the background, so switching the range here never
      // triggers a new API call.
      posts: {
        where: { mediaType: "REEL", postedAt: { gte: rangeStart, lt: rangeEndExclusive } },
        orderBy: { postedAt: "desc" },
        include: {
          dailyMetrics: { orderBy: { date: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!account) notFound();

  // "Follower aktuell" always reflects the latest known value, independent
  // of the selected stats range — it doesn't make sense to show a stale
  // count just because someone picked "Last Month".
  const latestMetricEver = await prisma.accountDailyMetric.findFirst({
    where: { accountId: account.id },
    orderBy: { date: "desc" },
  });

  // If nobody has synced this account yet today, kick off a sync in the
  // background on first render — at most once/day per account, since
  // HikerAPI is pay-per-request (see instagram-sync-run.ts).
  const today = normalizeDate(new Date().toISOString());
  const needsSync = !latestMetricEver || latestMetricEver.date.getTime() !== today.getTime();
  const boundSync = needsSync ? syncInstagramAccount.bind(null, account.id) : null;

  const rangeLabel =
    rangeKey === "custom"
      ? `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`
      : RANGE_OPTIONS.find((o) => o.key === rangeKey)?.label ?? "";

  const rangeMetrics = await prisma.accountDailyMetric.findMany({
    where: { accountId: account.id, date: { gte: rangeStart, lt: rangeEndExclusive } },
    orderBy: { date: "asc" },
  });
  const firstInRange = rangeMetrics[0];
  const lastInRange = rangeMetrics[rangeMetrics.length - 1];
  const followerDelta =
    firstInRange && lastInRange && firstInRange.id !== lastInRange.id
      ? lastInRange.followers - firstInRange.followers
      : null;

  // HikerAPI has no account-level "total views" figure (only per-reel), so
  // this sums the latest known views of the Reels posted in this range —
  // exactly what the Activity table below adds up to.
  const viewsInRange = account.posts.reduce(
    (sum, post) => sum + (post.dailyMetrics[0]?.views ?? 0),
    0
  );

  const linkClicksAgg = await prisma.linkClickImport.aggregate({
    where: {
      date: { gte: rangeStart, lt: rangeEndExclusive },
      OR: [
        { accountId: account.id },
        { post: { accountId: account.id } },
      ],
    },
    _sum: { clicks: true },
  });
  const linkClicksInRange = linkClicksAgg._sum.clicks ?? 0;

  const postRows: PostTableRow[] = account.posts.map((post) => {
    const metric = post.dailyMetrics[0];
    return {
      id: post.id,
      url: post.url,
      caption: post.caption,
      postedAt: post.postedAt.toISOString(),
      thumbnailUrl: post.thumbnailUrl,
      metric: metric
        ? { views: metric.views, likes: metric.likes, comments: metric.comments }
        : null,
    };
  });

  // Same rows as the Activity table below, just grouped by post day instead
  // of listed per-post — so the chart always has exactly what the table
  // has, no separate (and mostly-empty) daily-snapshot history required.
  const viewsByPostDay = new Map<string, number>();
  for (const row of postRows) {
    const day = row.postedAt.slice(0, 10);
    viewsByPostDay.set(day, (viewsByPostDay.get(day) ?? 0) + (row.metric?.views ?? 0));
  }
  const chartData = Array.from(viewsByPostDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, views]) => ({ date, timestamp: new Date(date).getTime(), views }));

  return (
    <div className="p-8">
      <Link
        href={`/creators/${account.creatorId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu {account.creator.name}
      </Link>

      {boundSync && (
        <div className="mt-4">
          <AutoSyncOnMount action={boundSync} />
        </div>
      )}

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {account.displayName}
          </h1>
          <a
            href={account.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-primary hover:underline"
          >
            @{account.username}
          </a>
        </div>
        <div className="flex items-start gap-2">
          <SyncInstagramButton accountId={account.id} />
          <ConnectSltBioDialog
            accountId={account.id}
            currentSlug={account.sltBioPageSlug}
          />
          <AddAccountMetricDialog accountId={account.id} />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <StatsRangePicker
          currentRange={rangeKey}
          currentFrom={searchParams.from ?? ""}
          currentTo={searchParams.to ?? ""}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Follower aktuell
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(latestMetricEver?.followers)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Neue Follower</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatDelta(followerDelta)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Views</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(viewsInRange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Link-Clicks (SLT.bio)
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(linkClicksInRange)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Reels</div>
            <div className="mt-1 text-xl font-semibold">
              <PostsTargetValue
                target={account.dailyPostsPlan * daysInRange}
                actual={postRows.length}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Views über Zeit · {rangeLabel}
          </h2>
          <ViewsChart data={chartData} />
        </CardContent>
      </Card>

      <PostsTable
        accountId={account.id}
        posts={postRows}
        title="Activity"
        emptyMessage="Keine Reels in diesem Zeitraum."
        headerAction={
          <Button variant="outline" asChild>
            <Link href={`/accounts/${account.id}/posts`}>
              <Layers className="h-4 w-4" />
              Ganzen Account zeigen
            </Link>
          </Button>
        }
      />
    </div>
  );
}

function isRangeKey(value: string | undefined): value is RangeKey {
  return (
    !!value &&
    ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "custom"].includes(
      value
    )
  );
}
