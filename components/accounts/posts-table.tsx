"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";

export type PostTableRow = {
  id: string;
  url: string;
  caption: string | null;
  postedAt: string;
  thumbnailUrl: string | null;
  metric: {
    views: number;
    likes: number;
    comments: number;
  } | null;
};

type SortField = "postedAt" | "views" | "likes" | "comments" | "engagement";
type SortDirection = "asc" | "desc";

function getSortValue(post: PostTableRow, field: SortField): number | null {
  if (field === "postedAt") return new Date(post.postedAt).getTime();
  if (!post.metric) return null;
  switch (field) {
    case "views":
      return post.metric.views;
    case "likes":
      return post.metric.likes;
    case "comments":
      return post.metric.comments;
    case "engagement":
      // The column displays a rate (engagement / views), so sort by that
      // same rate — sorting by the raw likes+comments sum would visually
      // look unsorted next to the displayed percentages.
      if (!post.metric.views) return null;
      return (post.metric.likes + post.metric.comments) / post.metric.views;
  }
}

export function PostsTable({
  accountId,
  posts,
  title,
  headerAction,
  emptyMessage = "Keine Reels gefunden.",
}: {
  accountId: string;
  posts: PostTableRow[];
  title: string;
  headerAction?: ReactNode;
  emptyMessage?: string;
}) {
  const [sortField, setSortField] = useState<SortField>("postedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const va = getSortValue(a, sortField);
      const vb = getSortValue(b, sortField);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDirection === "asc" ? va - vb : vb - va;
    });
  }, [posts, sortField, sortDirection]);

  function SortableHead({ field, label }: { field: SortField; label: string }) {
    const isActive = sortField === field;
    return (
      <TableHead className="text-right">
        <button
          type="button"
          onClick={() => handleSort(field)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground",
            isActive && "text-foreground"
          )}
        >
          {label}
          {isActive ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </button>
      </TableHead>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {headerAction}
      </div>

      <div className="mt-4 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reel</TableHead>
              <SortableHead field="postedAt" label="Datum" />
              <SortableHead field="views" label="Views" />
              <SortableHead field="likes" label="Likes" />
              <SortableHead field="comments" label="Kommentare" />
              <SortableHead field="engagement" label="Engagement" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPosts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
            {sortedPosts.map((post) => {
              const metric = post.metric;
              const engagement = metric && metric.likes + metric.comments;
              return (
                <TableRow key={post.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/accounts/${accountId}/posts/${post.id}`}
                        className="flex items-center gap-3"
                      >
                        {post.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.thumbnailUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded bg-muted" />
                        )}
                        <div className="max-w-[220px] truncate text-sm hover:text-primary hover:underline">
                          {post.caption || post.url}
                        </div>
                      </Link>
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Original-Post öffnen"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(post.postedAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(metric?.views)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(metric?.likes)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(metric?.comments)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(engagement, metric?.views)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
