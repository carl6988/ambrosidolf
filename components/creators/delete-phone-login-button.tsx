"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePhoneLogin } from "@/app/creators/[id]/management/actions";

export function DeletePhoneLoginButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      title="Entfernen"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await deletePhoneLogin(id);
        })
      }
    >
      <Trash2 className="h-3.5 w-3.5 text-destructive" />
    </Button>
  );
}
