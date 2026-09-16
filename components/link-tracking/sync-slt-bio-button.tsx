"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncSltBio } from "@/app/link-tracking/actions";

export function SyncSltBioButton() {
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setError(null);
    setWarning(null);
    setMessage(null);
    startTransition(async () => {
      const result = await syncSltBio();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const { fetched, matchedDays, unmatchedDays, unmatchedPageSlugs, partialFetchError } =
        result.summary;
      const parts = [`${fetched} Klick-Events geladen`, `${matchedDays} Tage zugeordnet`];
      if (unmatchedDays > 0) {
        parts.push(
          `${unmatchedDays} Tage ohne Zuordnung (${unmatchedPageSlugs.join(", ")})`
        );
      }
      setMessage(parts.join(" · "));
      if (partialFetchError) {
        setWarning(
          `Sync wurde vorzeitig abgebrochen (${partialFetchError}) — bereits geladene Daten wurden trotzdem gespeichert. Einfach nochmal synchronisieren.`
        );
      }
    });
  }

  return (
    <div>
      <Button onClick={handleSync} disabled={isPending} variant="outline">
        <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
        {isPending ? "Synchronisiere…" : "Jetzt synchronisieren"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
      {warning && <p className="mt-1 text-sm text-amber-500">{warning}</p>}
    </div>
  );
}
