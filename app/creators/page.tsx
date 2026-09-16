import Link from "next/link";
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
import { AddCreatorDialog } from "@/components/creators/add-creator-dialog";

export default async function CreatorsPage() {
  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      accounts: {
        include: {
          _count: { select: { posts: true } },
          dailyMetrics: { orderBy: { date: "desc" }, take: 1 },
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Creators</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {creators.length} Creator{creators.length === 1 ? "" : "s"}
          </p>
        </div>
        <AddCreatorDialog />
      </div>

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Accounts</TableHead>
              <TableHead className="text-right">Follower gesamt</TableHead>
              <TableHead className="text-right">Posts gesamt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creators.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground"
                >
                  Noch keine Creators angelegt.
                </TableCell>
              </TableRow>
            )}
            {creators.map((creator) => {
              const totalFollowers = creator.accounts.reduce(
                (sum, a) => sum + (a.dailyMetrics[0]?.followers ?? 0),
                0
              );
              const totalPosts = creator.accounts.reduce(
                (sum, a) => sum + a._count.posts,
                0
              );
              return (
                <TableRow key={creator.id}>
                  <TableCell>
                    <Link
                      href={`/creators/${creator.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {creator.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(creator.accounts.length)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(totalFollowers)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(totalPosts)}
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
