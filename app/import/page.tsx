import { CsvImportCard } from "@/components/import/csv-import-card";
import { importAccountMetricsCsv, importPostMetricsCsv } from "./actions";

export default function ImportPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        CSV-Import für Post- und Account-Metriken.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CsvImportCard
          title="Post-Metriken importieren"
          description="Tageswerte für bereits erfasste Posts."
          columns={[
            "account_username",
            "post_url oder post_external_id",
            "date",
            "views",
            "likes",
            "comments",
            "shares (optional)",
            "saves (optional)",
          ]}
          action={importPostMetricsCsv}
        />
        <CsvImportCard
          title="Account-Metriken importieren"
          description="Follower und Gesamt-Views pro Tag."
          columns={["account_username", "date", "followers", "total_views (optional)"]}
          action={importAccountMetricsCsv}
        />
      </div>
    </div>
  );
}
