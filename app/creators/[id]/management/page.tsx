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
import { Card, CardContent } from "@/components/ui/card";
import { EditManagementFieldDialog } from "@/components/creators/edit-management-field-dialog";
import { EditAccountPlanDialog } from "@/components/creators/edit-account-plan-dialog";
import { AddRecoveryAccountDialog } from "@/components/creators/add-recovery-account-dialog";
import { DeleteRecoveryAccountButton } from "@/components/creators/delete-recovery-account-button";
import { CONTENT_CAPACITY_FIELDS } from "./fields";

export default async function CreatorManagementPage({
  params,
}: {
  params: { id: string };
}) {
  const creator = await prisma.creator.findUnique({
    where: { id: params.id },
    include: {
      accounts: {
        orderBy: { createdAt: "desc" },
        select: { id: true, username: true, dailyPostsPlan: true, notes: true },
      },
      recoveryAccounts: { orderBy: { createdAt: "desc" } },
      managementFields: true,
    },
  });

  if (!creator) notFound();

  const fieldsByKey = new Map(creator.managementFields.map((f) => [f.key, f]));

  const postsDaily = creator.accounts.reduce((sum, a) => sum + a.dailyPostsPlan, 0);
  const postsWeekly = postsDaily * 7;

  return (
    <div className="p-8">
      <Link
        href={`/creators/${creator.id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu {creator.name}
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Management Overview · {creator.name}
      </h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        <div className="bg-primary/10 px-4 py-2 text-sm font-semibold tracking-wide text-primary">
          ACTIVE ACCOUNTS
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Daily Posts Plan</TableHead>
              <TableHead>Notes / Action</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {creator.accounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Noch keine Accounts.
                </TableCell>
              </TableRow>
            )}
            {creator.accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <Link
                    href={`/accounts/${account.id}`}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {account.username}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(account.dailyPostsPlan)}
                </TableCell>
                <TableCell>
                  <span className={account.notes ? "text-sm" : "text-sm text-muted-foreground"}>
                    {account.notes || "–"}
                  </span>
                </TableCell>
                <TableCell>
                  <EditAccountPlanDialog
                    accountId={account.id}
                    username={account.username}
                    currentDailyPostsPlan={account.dailyPostsPlan}
                    currentNotes={account.notes ?? ""}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between bg-primary/10 px-4 py-2">
          <span className="text-sm font-semibold tracking-wide text-primary">
            ACCOUNTS IN RECOVERY
          </span>
          <AddRecoveryAccountDialog creatorId={creator.id} />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Notes / Action</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {creator.recoveryAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  Keine Accounts in Recovery.
                </TableCell>
              </TableRow>
            )}
            {creator.recoveryAccounts.map((recoveryAccount) => (
              <TableRow key={recoveryAccount.id}>
                <TableCell>
                  <span className="font-medium text-foreground" title="Gesperrt — nicht verlinkt">
                    {recoveryAccount.username}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      recoveryAccount.note ? "text-sm" : "text-sm text-muted-foreground"
                    }
                  >
                    {recoveryAccount.note || "–"}
                  </span>
                </TableCell>
                <TableCell>
                  <DeleteRecoveryAccountButton id={recoveryAccount.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Active Accounts</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(creator.accounts.length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Accounts in Recovery</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(creator.recoveryAccounts.length)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Posts Daily</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(postsDaily)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Posts Weekly</div>
            <div className="mt-1 text-xl font-semibold tabular-nums">
              {formatNumber(postsWeekly)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-border">
        <div className="bg-primary/10 px-4 py-2 text-sm font-semibold tracking-wide text-primary">
          CONTENT CAPACITY
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead className="text-right">Number</TableHead>
              <TableHead>Note / Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CONTENT_CAPACITY_FIELDS.map((field) => {
              const stored = fieldsByKey.get(field.key);
              return (
                <TableRow key={field.key}>
                  <TableCell className="font-medium">{field.label}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {stored?.value || "–"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={stored?.note ? "text-sm" : "text-sm text-muted-foreground"}
                      >
                        {stored?.note || "–"}
                      </span>
                      <EditManagementFieldDialog
                        creatorId={creator.id}
                        fieldKey={field.key}
                        label={field.label}
                        editableValue
                        showAccountNames={false}
                        currentValue={stored?.value ?? ""}
                        currentAccountNames=""
                        currentNote={stored?.note ?? ""}
                      />
                    </div>
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
