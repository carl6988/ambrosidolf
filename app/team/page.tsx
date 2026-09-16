import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddUserDialog } from "@/components/team/add-user-dialog";
import { DeleteUserButton } from "@/components/team/delete-user-button";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {users.length} Mitarbeiter mit Zugriff auf das Dashboard.
          </p>
        </div>
        {session?.user.isAdmin && <AddUserDialog />}
      </div>

      {!session?.user.isAdmin && (
        <p className="mt-4 text-sm text-muted-foreground">
          Nur Admins können Mitarbeiter hinzufügen oder entfernen.
        </p>
      )}

      <div className="mt-6 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Seit</TableHead>
              {session?.user.isAdmin && <TableHead className="text-right">—</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Mitarbeiter</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.createdAt)}
                </TableCell>
                {session?.user.isAdmin && (
                  <TableCell className="text-right">
                    {user.id !== session.user.id && (
                      <DeleteUserButton userId={user.id} userName={user.name} />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
