"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ALL_MANAGEMENT_FIELDS } from "./fields";

type ActionResult = { error?: string; success?: true };

export async function upsertManagementField(
  formData: FormData
): Promise<ActionResult> {
  const creatorId = String(formData.get("creatorId") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const accountNames = String(formData.get("accountNames") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!creatorId || !key) {
    return { error: "Feld fehlt." };
  }
  if (!ALL_MANAGEMENT_FIELDS.some((f) => f.key === key)) {
    return { error: "Unbekanntes Feld." };
  }

  try {
    await prisma.creatorManagementField.upsert({
      where: { creatorId_key: { creatorId, key } },
      create: {
        creatorId,
        key,
        value: value || null,
        accountNames: accountNames || null,
        note: note || null,
      },
      update: {
        value: value || null,
        accountNames: accountNames || null,
        note: note || null,
      },
    });
  } catch {
    return { error: "Konnte nicht gespeichert werden." };
  }

  revalidatePath(`/creators/${creatorId}/management`);
  return { success: true };
}
