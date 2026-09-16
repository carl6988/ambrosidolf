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
import { EditAccountPlanDialog } from "@/components/creators/edit-account-plan-dialog";
import { AddRecoveryAccountDialog } from "@/components/creators/add-recovery-account-dialog";
import { DeleteRecoveryAccountButton } from "@/components/creators/delete-recovery-account-button";
import { PhoneLoginDialog } from "@/components/creators/phone-login-dialog";
import { DeletePhoneLoginButton } from "@/components/creators/delete-phone-login-button";
import { MaskedCell } from "@/components/creators/masked-cell";

function profileLink(media: string | null, username: string | null): string | null {
  if (!username) return null;
  const m = media?.toLowerCase() ?? "";
  if (m.includes("instagram")) return `https://instagram.com/${username}`;
  if (m.includes("twitter") || m === "x") return `https://x.com/${username}`;
  return null;
}

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
      phoneLogins: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!creator) notFound();

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
        <div className="flex items-center justify-between bg-primary/10 px-4 py-2">
          <span className="text-sm font-semibold tracking-wide text-primary">
            LOGIN OVERVIEW
          </span>
          <PhoneLoginDialog creatorId={creator.id} />
        </div>
        <div className="overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Phone #</TableHead>
                <TableHead className="whitespace-nowrap">Phone Number</TableHead>
                <TableHead className="whitespace-nowrap">Phone Owner</TableHead>
                <TableHead className="whitespace-nowrap">Media</TableHead>
                <TableHead className="whitespace-nowrap">Account on Phone</TableHead>
                <TableHead className="whitespace-nowrap">Account Password</TableHead>
                <TableHead className="whitespace-nowrap">Gmail / Apple ID</TableHead>
                <TableHead className="whitespace-nowrap">Gmail / Apple ID Password</TableHead>
                <TableHead className="whitespace-nowrap">Gmail created on Phone</TableHead>
                <TableHead className="whitespace-nowrap">SIM PIN</TableHead>
                <TableHead className="whitespace-nowrap">Note / Action</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {creator.phoneLogins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-sm text-muted-foreground">
                    Noch keine Logins erfasst.
                  </TableCell>
                </TableRow>
              )}
              {creator.phoneLogins.map((login) => {
                const link = profileLink(login.media, login.accountUsername);
                return (
                  <TableRow key={login.id}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {login.phoneLabel}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{login.phoneNumber || "–"}</TableCell>
                    <TableCell className="whitespace-nowrap">{login.phoneOwner || "–"}</TableCell>
                    <TableCell className="whitespace-nowrap">{login.media || "–"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {login.accountUsername ? (
                        link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {login.accountUsername}
                          </a>
                        ) : (
                          login.accountUsername
                        )
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <MaskedCell value={login.accountPassword} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{login.gmailAppleId || "–"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <MaskedCell value={login.gmailApplePassword} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {login.gmailCreatedOnPhone || "–"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <MaskedCell value={login.simPin} />
                    </TableCell>
                    <TableCell className="max-w-[240px] whitespace-normal text-sm text-muted-foreground">
                      {login.note || "–"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <PhoneLoginDialog
                          creatorId={creator.id}
                          existing={{
                            id: login.id,
                            phoneLabel: login.phoneLabel,
                            phoneNumber: login.phoneNumber,
                            phoneOwner: login.phoneOwner,
                            media: login.media,
                            accountUsername: login.accountUsername,
                            accountPassword: login.accountPassword,
                            gmailAppleId: login.gmailAppleId,
                            gmailApplePassword: login.gmailApplePassword,
                            gmailCreatedOnPhone: login.gmailCreatedOnPhone,
                            simPin: login.simPin,
                            note: login.note,
                          }}
                        />
                        <DeletePhoneLoginButton id={login.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
