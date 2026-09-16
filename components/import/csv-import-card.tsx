"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ImportActionResult, ImportSummary } from "@/app/import/actions";

export function CsvImportCard({
  title,
  description,
  columns,
  action,
}: {
  title: string;
  description: string;
  columns: string[];
  action: (formData: FormData) => Promise<ImportActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSummary(null);
    startTransition(async () => {
      const result = await action(formData);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSummary(result.summary);
      formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Spalten: {columns.join(", ")}
          </div>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            className="block w-full text-sm text-foreground file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isPending}>
            <Upload className="h-4 w-4" />
            {isPending ? "Importiere…" : "Importieren"}
          </Button>
        </form>

        {summary && (
          <div className="mt-4 rounded-md border border-border p-3">
            <p className="text-sm">
              <span className="font-medium text-foreground">
                {summary.successCount}
              </span>{" "}
              von {summary.total} Zeile{summary.total === 1 ? "" : "n"} erfolgreich
              importiert
              {summary.errors.length > 0 && (
                <span className="text-destructive">
                  {" "}
                  · {summary.errors.length} Fehler
                </span>
              )}
            </p>
            {summary.errors.length > 0 && (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-destructive">
                {summary.errors.map((e, idx) => (
                  <li key={idx}>
                    Zeile {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
