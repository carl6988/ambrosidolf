import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PostsTable, type PostTableRow } from "@/components/accounts/posts-table";
import { AddPostDialog } from "@/components/accounts/add-post-dialog";
import { SyncAllReelsButton } from "@/components/accounts/sync-all-reels-button";

export default async function AccountAllReelsPage({
  params,
}: {
  params: { id: string };
}) {
  const account = await prisma.account.findUnique({
    where: { id: params.id },
    include: {
      posts: {
        where: { mediaType: "REEL" },
        orderBy: { postedAt: "desc" },
        include: {
          dailyMetrics: { orderBy: { date: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!account) notFound();

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

  return (
    <div className="p-8">
      <Link
        href={`/accounts/${account.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu {account.displayName}
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {account.displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Reels · {account.posts.length}
          </p>
        </div>
        <SyncAllReelsButton accountId={account.id} />
      </div>

      <PostsTable
        accountId={account.id}
        posts={postRows}
        title="Alle Reels"
        headerAction={<AddPostDialog accountId={account.id} />}
      />
    </div>
  );
}
