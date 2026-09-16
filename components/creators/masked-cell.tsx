"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Passwords/PINs are stored as plain text (this is a reference vault, not an
// auth mechanism — same as the spreadsheet it replaces), but hidden by
// default in the table so they're not visible on a glance/screen-share.
export function MaskedCell({ value }: { value: string | null }) {
  const [revealed, setRevealed] = useState(false);

  if (!value) {
    return <span className="text-sm text-muted-foreground">–</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed((r) => !r)}
      className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-primary"
      title={revealed ? "Verbergen" : "Anzeigen"}
    >
      <span className="font-mono">{revealed ? value : "••••••••"}</span>
      {revealed ? (
        <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}
