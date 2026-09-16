"use client";

import { useRef, useState, useTransition } from "react";
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
import { upsertManagementField } from "@/app/creators/[id]/management/actions";

export function EditManagementFieldDialog({
  creatorId,
  fieldKey,
  label,
  editableValue,
  showAccountNames,
  currentValue,
  currentAccountNames,
  currentNote,
}: {
  creatorId: string;
  fieldKey: string;
  label: string;
  editableValue: boolean;
  showAccountNames: boolean;
  currentValue: string;
  currentAccountNames: string;
  currentNote: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertManagementField(formData);
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
          <DialogTitle>{label}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="creatorId" value={creatorId} />
          <input type="hidden" name="key" value={fieldKey} />
          {editableValue && (
            <div className="space-y-2">
              <Label htmlFor={`${fieldKey}-value`}>Zahl / Wert</Label>
              <Input
                id={`${fieldKey}-value`}
                name="value"
                defaultValue={currentValue}
                placeholder="z.B. 3"
              />
            </div>
          )}
          {editableValue && showAccountNames && (
            <div className="space-y-2">
              <Label htmlFor={`${fieldKey}-accountNames`}>
                Account-Namen (Komma-getrennt)
              </Label>
              <Input
                id={`${fieldKey}-accountNames`}
                name="accountNames"
                defaultValue={currentAccountNames}
                placeholder="z.B. vanillaamuffins"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`${fieldKey}-note`}>Notiz / Action</Label>
            <Textarea
              id={`${fieldKey}-note`}
              name="note"
              defaultValue={currentNote}
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
