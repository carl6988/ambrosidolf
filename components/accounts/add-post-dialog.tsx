"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { createPost } from "@/app/accounts/actions";

export function AddPostDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createPost(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
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
          <Plus className="h-4 w-4" />
          Neues Reel erfassen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Reel erfassen</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="accountId" value={accountId} />
          <input type="hidden" name="mediaType" value="REEL" />
          <div className="space-y-2">
            <Label htmlFor="url">Reel-URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://instagram.com/reel/..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea id="caption" name="caption" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postedAt">Veröffentlichungsdatum</Label>
            <Input id="postedAt" name="postedAt" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thumbnailUrl">Thumbnail-URL (optional)</Label>
            <Input id="thumbnailUrl" name="thumbnailUrl" type="url" />
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
