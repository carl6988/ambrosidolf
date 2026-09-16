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
