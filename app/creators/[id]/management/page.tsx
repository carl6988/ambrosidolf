import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditManagementFieldDialog } from "@/components/creators/edit-management-field-dialog";
import {
  CONTENT_CAPACITY_FIELDS,
  INSTAGRAM_ACCOUNT_FIELDS,
  type ManagementFieldConfig,
} from "./fields";

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
        select: { id: true, username: true },
      },
      managementFields: true,
    },
  });

  if (!creator) notFound();

  const fieldsByKey = new Map(creator.managementFields.map((f) => [f.key, f]));

  function renderRow(field: ManagementFieldConfig, showAccountNames: boolean) {
    const stored = fieldsByKey.get(field.key);
    const isDerivedActiveAccounts = field.derived && field.key === "active_ig_accounts";

    const numberDisplay = isDerivedActiveAccounts
      ? String(creator!.accounts.length)
      : stored?.value || "–";

    return (
      <TableRow key={field.key}>
        <TableCell className="font-medium">{field.label}</TableCell>
        <TableCell className="text-right tabular-nums">{numberDisplay}</TableCell>
        {showAccountNames && (
          <TableCell>
            {isDerivedActiveAccounts ? (
              creator!.accounts.length === 0 ? (
                <span className="text-muted-foreground">–</span>
              ) : (
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                  {creator!.accounts.map((account, i) => (
                    <span key={account.id}>
                      <Link
                        href={`/accounts/${account.id}`}
                        className="text-foreground hover:text-primary hover:underline"
                      >
                        {account.username}
                      </Link>
                      {i < creator!.accounts.length - 1 ? "," : ""}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <span className={stored?.accountNames ? "" : "text-muted-foreground"}>
                {stored?.accountNames || "–"}
              </span>
            )}
          </TableCell>
        )}
        <TableCell>
          <div className="flex items-center justify-between gap-2">
            <span
              className={
                stored?.note ? "text-sm" : "text-sm text-muted-foreground"
              }
            >
              {stored?.note || "–"}
            </span>
            <EditManagementFieldDialog
              creatorId={creator!.id}
              fieldKey={field.key}
              label={field.label}
              editableValue={!field.derived}
              showAccountNames={showAccountNames}
              currentValue={stored?.value ?? ""}
              currentAccountNames={stored?.accountNames ?? ""}
              currentNote={stored?.note ?? ""}
            />
          </div>
        </TableCell>
      </TableRow>
    );
  }

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
          INSTAGRAM ACCOUNTS
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead className="text-right">Number</TableHead>
              <TableHead>Account Names</TableHead>
              <TableHead>Note / Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INSTAGRAM_ACCOUNT_FIELDS.map((field) => renderRow(field, true))}
          </TableBody>
        </Table>
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
            {CONTENT_CAPACITY_FIELDS.map((field) => renderRow(field, false))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
