import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDelta, formatNumber, formatPercent } from "@/lib/format";
import { RANGE_OPTIONS, resolveDateRange, type RangeKey } from "@/lib/date-range";
import { normalizeDate } from "@/lib/date";
import { profileColor } from "@/lib/profile-colors";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";
import { DeleteAccountButton } from "@/components/accounts/delete-account-button";
import { PostsTargetValue } from "@/components/accounts/posts-target-value";
import { ViewsChart, type DataPoint } from "@/components/accounts/views-chart";
import { PostsTable, type PostTableRow } from "@/components/accounts/posts-table";
import { StatsRangePicker } from "@/components/accounts/stats-range-picker";
import { SyncCreatorButton } from "@/components/creators/sync-creator-button";
import { syncInstagramForCreator } from "@/app/creators/instagram-sync-actions";
import { AutoSyncOnMount } from "@/components/shared/auto-sync-on-mount";

export default async function CreatorDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const rangeKey: RangeKey = isRangeKey(searchParams.range) ? searchParams.range : "this_week";
  const { start: rangeStart, end: rangeEnd } = resolveDateRange(
    rangeKey,
    searchParams.from,
    searchParams.to
  );
  // See app/accounts/[id]/page.tsx for why this is exclusive.
  const rangeEndExclusive = new Date(rangeEnd);
  rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);
  const daysInRange = Math.round(
    (rangeEndExclusive.getTime() - rangeStart.getTime()) / 86_400_000
  );

  const creator = await prisma.creator.findUnique({
    where: { id: params.id },
    include: {
      accounts: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { posts: true } },
          dailyMetrics: { orderBy: { date: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!creator) notFound();

  const rangeLabel =
    rangeKey === "custom"
      ? `${formatDate(rangeStart)} – ${formatDate(rangeEnd)}`
      : RANGE_OPTIONS.find((o) => o.key === rangeKey)?.label ?? "";

  // Reels across all of this Creator's accounts in the selected range — the
  // same rows power the stats cards, the chart, and the Top Reels table
  // below, so switching the range never triggers a new query shape.
  const reels = await prisma.post.findMany({
    where: {
      account: { creatorId: creator.id },
      mediaType: "REEL",
      postedAt: { gte: rangeStart, lt: rangeEndExclusive },
    },
    orderBy: { postedAt: "desc" },
    include: {
      dailyMetrics: { orderBy: { date: "desc" }, take: 1 },
      account: { select: { id: true, username: true } },
    },
  });

  // "Follower gesamt" always reflects each account's latest known value,
  // independent of the selected stats range.
  const latestMetricsPerAccount = await prisma.accountDailyMetric.findMany({
    where: { account: { creatorId: creator.id } },
    orderBy: { date: "desc" },
    distinct: ["accountId"],
  });
  const totalFollowers = latestMetricsPerAccount.reduce(
    (sum, m) => sum + m.followers,
    0
  );

  // If any account hasn't synced today yet, kick off a Creator-wide sync in
  // the background on first render — at most once/day, since HikerAPI is
  // pay-per-request (see instagram-sync-run.ts).
  const today = normalizeDate(new Date().toISOString());
  const syncedTodayAccountIds = new Set(
    latestMetricsPerAccount
      .filter((m) => m.date.getTime() === today.getTime())
      .map((m) => m.accountId)
  );
  const needsSync = creator.accounts.some((a) => !syncedTodayAccountIds.has(a.id));
  const boundSync = needsSync ? syncInstagramForCreator.bind(null, creator.id) : null;

  const rangeMetrics = await prisma.accountDailyMetric.findMany({
    where: { account: { creatorId: creator.id }, date: { gte: rangeStart, lt: rangeEndExclusive } },
    orderBy: { date: "asc" },
  });
  const metricsByAccount = new Map<string, typeof rangeMetrics>();
  for (const m of rangeMetrics) {
    const list = metricsByAccount.get(m.accountId) ?? [];
    list.push(m);
    metricsByAccount.set(m.accountId, list);
  }
  let newFollowers = 0;
  let hasFollowerDelta = false;
  for (const list of Array.from(metricsByAccount.values())) {
    if (list.length < 2) continue;
    hasFollowerDelta = true;
    newFollowers += list[list.length - 1].followers - list[0].followers;
  }

  const linkClicksAgg = await prisma.linkClickImport.aggregate({
    where: {
      date: { gte: rangeStart, lt: rangeEndExclusive },
      OR: [
        { account: { creatorId: creator.id } },
        { post: { account: { creatorId: creator.id } } },
      ],
    },
    _sum: { clicks: true },
  });
  const linkClicksInRange = linkClicksAgg._sum.clicks ?? 0;

  const postRows: PostTableRow[] = reels.map((post) => {
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
      account: { id: post.account.id, username: post.account.username },
    };
  });

  const viewsInRange = postRows.reduce((sum, row) => sum + (row.metric?.views ?? 0), 0);

  const postsTarget = creator.accounts.reduce(
    (sum, a) => sum + a.dailyPostsPlan * daysInRange,
    0
  );

  const topReels = [...postRows]
    .sort((a, b) => (b.metric?.views ?? 0) - (a.metric?.views ?? 0))
    .slice(0, 10);

  // Views grouped by post day, and post counts grouped by (account, day) —
  // the latter feeds the per-profile Daily Posts bars overlaid on the chart
  // below, so a views dip can be visually checked against "did they even
  // post that day" at a glance.
  const viewsByPostDay = new Map<string, number>();
  const postsByAccountDay = new Map<string, Map<string, number>>();
  for (const row of postRows) {
    const day = row.postedAt.slice(0, 10);
    viewsByPostDay.set(day, (viewsByPostDay.get(day) ?? 0) + (row.metric?.views ?? 0));
    const accountId = row.account!.id;
    const byDay = postsByAccountDay.get(accountId) ?? new Map<string, number>();
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    postsByAccountDay.set(accountId, byDay);
  }

  const chartProfiles = creator.accounts.map((account, index) => ({
    accountId: account.id,
    label: account.username,
    color: profileColor(index),
  }));

  // One point per day in the selected range (not just days with posts) so
  // a day with zero posts still shows an all-red bar instead of vanishing.
  const chartData: DataPoint[] = [];
  for (
    let cursor = new Date(rangeStart);
    cursor.getTime() < rangeEndExclusive.getTime();
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const day = cursor.toISOString().slice(0, 10);
    const point: DataPoint = {
      date: day,
      views: viewsByPostDay.get(day) ?? 0,
    };
    for (const account of creator.accounts) {
      if (account.dailyPostsPlan <= 0) continue;
      const count = postsByAccountDay.get(account.id)?.get(day) ?? 0;
      const donePct = Math.min(count / account.dailyPostsPlan, 1) * 100;
      point[`${account.id}_donePct`] = donePct;
      point[`${account.id}_missingPct`] = 100 - donePct;
    }
    chartData.push(point);
  }

  return (
    <div className="p-8">
      <Link
        href="/creators"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Creators
      </Link>

      {boundSync && (
        <div className="mt-4">
          <AutoSyncOnMount action={boundSync} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {creator.name}
            </h1>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/creators/${creator.id}/management`}>
                Management Overview
              </Link>
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {creator.accounts.length} Account
            {creator.accounts.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <SyncCreatorButton creatorId={creator.id} />
          <StatsRangePicker
            currentRange={rangeKey}
            currentFrom={searchParams.from ?? ""}
            currentTo={searchParams.to ?? ""}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
            <div className="text-xs text-muted-foreground">Follower gesamt</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(totalFollowers)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Neue Follower</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {hasFollowerDelta ? formatDelta(newFollowers) : "–"}
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
            <div className="text-xs text-muted-foreground">Posts</div>
            <div className="mt-1 text-xl font-semibold">
              <PostsTargetValue target={postsTarget} actual={postRows.length} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Views → Link-Click Conversion
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatPercent(linkClicksInRange, viewsInRange)}
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Neue Subs</div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">
              Bald verfügbar
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Link-Click → Sub Conversion
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">
              Bald verfügbar
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Views über Zeit · {rangeLabel}
          </h2>
          <ViewsChart data={chartData} profiles={chartProfiles} />
        </CardContent>
      </Card>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
        <AddAccountDialog creatorId={creator.id} />
      </div>

      <div className="mt-4 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Follower aktuell</TableHead>
              <TableHead className="text-right">Views (24h)</TableHead>
              <TableHead className="text-right">Posts</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {creator.accounts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground"
                >
                  Noch keine Accounts für diesen Creator angelegt.
                </TableCell>
              </TableRow>
            )}
            {creator.accounts.map((account) => {
              const latest = account.dailyMetrics[0];
              return (
                <TableRow key={account.id}>
                  <TableCell>
                    <Link
                      href={`/accounts/${account.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {account.username}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {account.displayName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(latest?.followers)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(latest?.totalViews)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(account._count.posts)}
                  </TableCell>
                  <TableCell>
                    <DeleteAccountButton
                      accountId={account.id}
                      username={account.username}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PostsTable
        accountId={creator.accounts[0]?.id ?? ""}
        posts={topReels}
        title="Top Reels"
        emptyMessage="Keine Reels in diesem Zeitraum."
        defaultSortField="views"
        showAccountColumn
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
