"use client";

import { useRef, useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
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
import { upsertPhoneLogin } from "@/app/creators/[id]/management/actions";

export type PhoneLoginValues = {
  id: string;
  phoneLabel: string;
  phoneNumber: string | null;
  phoneOwner: string | null;
  media: string | null;
  accountUsername: string | null;
  accountPassword: string | null;
  gmailAppleId: string | null;
  gmailApplePassword: string | null;
  gmailCreatedOnPhone: string | null;
  simPin: string | null;
  note: string | null;
};

const FIELDS: { name: keyof PhoneLoginValues; label: string; required?: boolean }[] = [
  { name: "phoneLabel", label: "Phone #", required: true },
  { name: "phoneNumber", label: "Phone Number" },
  { name: "phoneOwner", label: "Phone Owner" },
  { name: "media", label: "Media" },
  { name: "accountUsername", label: "Account on Phone" },
  { name: "accountPassword", label: "Account Password" },
  { name: "gmailAppleId", label: "Gmail / Apple ID" },
  { name: "gmailApplePassword", label: "Gmail / Apple ID Password" },
  { name: "gmailCreatedOnPhone", label: "Gmail created on Phone" },
  { name: "simPin", label: "SIM PIN" },
];

export function PhoneLoginDialog({
  creatorId,
  existing,
}: {
  creatorId: string;
  existing?: PhoneLoginValues;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertPhoneLogin(formData);
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
        {existing ? (
          <Button variant="ghost" size="sm" title="Bearbeiten">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            Login hinzufügen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? existing.phoneLabel : "Login hinzufügen"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <input type="hidden" name="creatorId" value={creatorId} />
          {existing && <input type="hidden" name="id" value={existing.id} />}
          {FIELDS.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                name={field.name}
                defaultValue={existing?.[field.name] ?? ""}
                required={field.required}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="note">Note / Action</Label>
            <Textarea id="note" name="note" defaultValue={existing?.note ?? ""} />
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
