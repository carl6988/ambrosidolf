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
import { deleteCreator } from "@/app/creators/actions";

export function DeleteCreatorButton({
  creatorId,
  creatorName,
  accountCount,
}: {
  creatorId: string;
  creatorName: string;
  accountCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCreator(creatorId);
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
        <Button variant="ghost" size="sm" title="Creator löschen">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creator löschen</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &quot;{creatorName}&quot; wirklich löschen? Das löscht unwiderruflich{" "}
          <span className="font-medium text-foreground">
            {accountCount} Account{accountCount === 1 ? "" : "s"}
          </span>{" "}
          mitsamt allen Posts, Tageswerten und Statistiken. Importierte Link-Clicks
          bleiben erhalten, aber ohne Zuordnung.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Lösche…" : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
