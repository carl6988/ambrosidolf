"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteAccount } from "@/app/accounts/actions";

export function DeleteAccountButton({
  accountId,
  username,
}: {
  accountId: string;
  username: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(accountId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Profil entfernen"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil entfernen</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          @{username} wirklich entfernen? Das löscht unwiderruflich alle Posts,
          Tageswerte und Statistiken dieses Profils. Importierte Link-Clicks
          bleiben erhalten, aber ohne Zuordnung.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Entferne…" : "Endgültig entfernen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
