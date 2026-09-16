import { CheckCircle2, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate, formatNumber } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CsvImportCard } from "@/components/import/csv-import-card";
import { SyncSltBioButton } from "@/components/link-tracking/sync-slt-bio-button";
import { importLinkClicksCsv } from "./actions";

export default async function LinkTrackingPage() {
  const isConfigured = Boolean(process.env.SLT_BIO_API_KEY);

  const imports = await prisma.linkClickImport.findMany({
    orderBy: { importedAt: "desc" },
    take: 200,
    include: {
      account: { select: { username: true } },
      post: { select: { url: true, caption: true } },
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Link-Tracking</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Klick-Daten von SLT.bio pro Account.
      </p>

      <Card className="mt-6">
        <CardContent className="flex items-start gap-3 p-4">
          {isConfigured ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          ) : (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div className="flex-1">
            <p className="text-sm">
              {isConfigured
                ? "SLT.bio-API ist verbunden. Klicks werden pro Account über den verbundenen Page-Slug zugeordnet (siehe \"SLT.bio verbinden\" auf der Account-Seite)."
                : "SLT.bio-Anbindung ist noch nicht aktiv (kein API-Key in .env) — hier können in der Zwischenzeit bereits Rohdaten per CSV importiert werden."}
            </p>
            {isConfigured && (
              <div className="mt-3">
                <SyncSltBioButton />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <CsvImportCard
          title="Link-Clicks importieren"
          description="Manueller CSV-Fallback für SLT.bio-Klickdaten."
          columns={[
            "account_username (optional)",
            "post_url (optional)",
            "date",
            "clicks",
            "unique_clicks (optional)",
          ]}
          action={importLinkClicksCsv}
        />
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight">
        Importierte Link-Clicks
      </h2>

      <div className="mt-4 rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Zuordnung</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Unique Clicks</TableHead>
              <TableHead>Quelle</TableHead>
              <TableHead>Importiert am</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {imports.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground"
                >
                  Noch keine Link-Clicks importiert.
                </TableCell>
              </TableRow>
            )}
            {imports.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.date)}
                </TableCell>
                <TableCell>
                  {row.account ? (
                    <span className="text-sm">
                      {row.account.username}
                      {row.post && (
                        <span className="text-muted-foreground">
                          {" "}
                          · {row.post.caption || row.post.url}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      Nicht zugeordnet
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.clicks)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(row.uniqueClicks)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.source}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.importedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
