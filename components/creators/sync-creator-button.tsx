"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncInstagramForCreator } from "@/app/creators/instagram-sync-actions";

export function SyncCreatorButton({ creatorId }: { creatorId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await syncInstagramForCreator(creatorId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const { accountsSynced, accountsFailed, reelsScraped, reelsCreated } = result.summary;
      const parts = [
        `${accountsSynced} Account${accountsSynced === 1 ? "" : "s"} synchronisiert`,
        `${reelsScraped} Reels`,
      ];
      if (reelsCreated > 0) parts.push(`${reelsCreated} neu entdeckt`);
      if (accountsFailed > 0) parts.push(`${accountsFailed} fehlgeschlagen`);
      setMessage(parts.join(" · "));
    });
  }

  return (
    <div>
      <Button onClick={handleSync} disabled={isPending} variant="outline" size="sm">
        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
        {isPending ? "Synchronisiere…" : "Von Instagram synchronisieren"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
