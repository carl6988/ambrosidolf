"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateAccountSltBio } from "@/app/accounts/actions";

export function ConnectSltBioDialog({
  accountId,
  currentSlug,
}: {
  accountId: string;
  currentSlug: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateAccountSltBio(formData);
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
        <Button variant="outline" size="sm">
          <Link2 className="h-3.5 w-3.5" />
          {currentSlug ? `Verbunden: ${currentSlug}` : "SLT.bio verbinden"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>SLT.bio verbinden</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <div className="space-y-2">
            <Label htmlFor="sltBioPageSlug">SLT.bio-Link oder Slug</Label>
            <Input
              id="sltBioPageSlug"
              name="sltBioPageSlug"
              placeholder="https://slt.bio/reisewelt-de oder reisewelt-de"
              defaultValue={currentSlug ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Leer lassen, um die Verknüpfung zu entfernen.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Speichern…" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
