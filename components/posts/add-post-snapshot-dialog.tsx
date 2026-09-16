"use client";

import { useState, useTransition } from "react";
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
import { upsertPostDailyMetric } from "@/app/accounts/actions";
import { toDateInputValue } from "@/lib/format";

type TodaysMetric = {
  views: number;
  likes: number;
  comments: number;
  shares: number | null;
  saves: number | null;
} | null;

export function AddPostSnapshotDialog({
  postId,
  todaysMetric,
}: {
  postId: string;
  todaysMetric: TodaysMetric;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isEditing = todaysMetric !== null;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertPostDailyMetric(formData);
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
          {isEditing ? "Heutigen Snapshot bearbeiten" : "Heutigen Snapshot eintragen"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Heutigen Snapshot bearbeiten" : "Heutigen Snapshot eintragen"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="postId" value={postId} />
          <input
            type="hidden"
            name="date"
            value={toDateInputValue(new Date())}
          />
          <p className="text-sm text-muted-foreground">
            Datum: {toDateInputValue(new Date())}
            {isEditing && " — bestehender Eintrag wird aktualisiert."}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="views">Views</Label>
              <Input
                id="views"
                name="views"
                type="number"
                min={0}
                defaultValue={todaysMetric?.views ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="likes">Likes</Label>
              <Input
                id="likes"
                name="likes"
                type="number"
                min={0}
                defaultValue={todaysMetric?.likes ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Kommentare</Label>
              <Input
                id="comments"
                name="comments"
                type="number"
                min={0}
                defaultValue={todaysMetric?.comments ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shares">Shares (optional)</Label>
              <Input
                id="shares"
                name="shares"
                type="number"
                min={0}
                defaultValue={todaysMetric?.shares ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saves">Saves (optional)</Label>
              <Input
                id="saves"
                name="saves"
                type="number"
                min={0}
                defaultValue={todaysMetric?.saves ?? ""}
              />
            </div>
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
