import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddAccountDialog } from "@/components/accounts/add-account-dialog";

export default async function CreatorDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  return (
    <div className="p-8">
      <Link
        href="/creators"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Creators
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {creator.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {creator.accounts.length} Account
            {creator.accounts.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddAccountDialog creatorId={creator.id} />
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead className="text-right">Follower aktuell</TableHead>
              <TableHead className="text-right">Views (24h)</TableHead>
              <TableHead className="text-right">Posts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creator.accounts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
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
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
