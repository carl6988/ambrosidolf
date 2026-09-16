"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { syncAllInstagramReels } from "@/app/accounts/instagram-sync-actions";

export function SyncAllReelsButton({ accountId }: { accountId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await syncAllInstagramReels(accountId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const { reelsScraped, reelsCreated, pagesFetched } = result.summary;
      setMessage(
        `${formatNumber(reelsScraped)} Reels durchsucht (${pagesFetched} Seiten) · ${formatNumber(reelsCreated)} neu entdeckt`
      );
    });
  }

  return (
    <div>
      <Button onClick={handleSync} disabled={isPending} variant="outline">
        <Download className={cn("h-4 w-4", isPending && "animate-pulse")} />
        {isPending ? "Lädt gesamten Account…" : "Vollständig von Instagram laden"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
