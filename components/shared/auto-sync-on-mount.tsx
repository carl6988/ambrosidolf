"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/**
 * Fires a bound server action once on mount (e.g.
 * `syncInstagramAccount.bind(null, accountId)`), shows a small inline
 * progress note while it runs, then refreshes the page's server data.
 * Pages only render this when today's data hasn't been synced yet (see
 * the `needsSync` check in app/accounts/[id]/page.tsx and
 * app/creators/[id]/page.tsx), so this fires at most once per day per
 * account — HikerAPI is pay-per-request, so we don't want this re-running
 * on every visit.
 */
export function AutoSyncOnMount({ action }: { action: () => Promise<unknown> }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(true);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    action().finally(() => {
      setSyncing(false);
      router.refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!syncing) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      Synchronisiere aktuelle Daten von Instagram…
    </div>
  );
}
