"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionResult = { error?: string; success?: true };

export async function createCreator(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { error: "Bitte einen Namen angeben." };
  }

  try {
    await prisma.creator.create({ data: { name } });
  } catch {
    return { error: "Creator konnte nicht angelegt werden." };
  }

  revalidatePath("/creators");
  return { success: true };
}

export async function deleteCreator(creatorId: string): Promise<ActionResult> {
  try {
    // Cascades through Accounts -> Posts -> daily metrics (see schema.prisma
    // onDelete: Cascade). LinkClickImport rows are kept but unlinked
    // (onDelete: SetNull) rather than deleted, since imported click history
    // has value independent of whether the account still exists.
    await prisma.creator.delete({ where: { id: creatorId } });
  } catch {
    return { error: "Creator konnte nicht gelöscht werden." };
  }

  revalidatePath("/creators");
  return { success: true };
}
