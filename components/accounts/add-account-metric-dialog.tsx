"use client";

import { useRef, useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
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
import { upsertAccountDailyMetric } from "@/app/accounts/actions";
import { toDateInputValue } from "@/lib/format";

export function AddAccountMetricDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertAccountDailyMetric(formData);
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
        <Button variant="outline">
          <CalendarPlus className="h-4 w-4" />
          Tageswerte eintragen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tageswerte eintragen</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={toDateInputValue(new Date())}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="followers">Follower</Label>
            <Input id="followers" name="followers" type="number" min={0} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalViews">Gesamt-Views (optional)</Label>
            <Input id="totalViews" name="totalViews" type="number" min={0} />
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
