"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateAccountPlan } from "@/app/creators/[id]/management/actions";

export function EditAccountPlanDialog({
  accountId,
  username,
  currentDailyPostsPlan,
  currentNotes,
}: {
  accountId: string;
  username: string;
  currentDailyPostsPlan: number;
  currentNotes: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateAccountPlan(formData);
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
        <Button variant="ghost" size="sm" title="Bearbeiten">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>@{username}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <div className="space-y-2">
            <Label htmlFor={`${accountId}-plan`}>Daily Posts Plan</Label>
            <Input
              id={`${accountId}-plan`}
              name="dailyPostsPlan"
              type="number"
              min={0}
              step={1}
              defaultValue={currentDailyPostsPlan}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${accountId}-notes`}>Notes / Action</Label>
            <Textarea
              id={`${accountId}-notes`}
              name="notes"
              defaultValue={currentNotes}
              placeholder="Notizen..."
            />
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
