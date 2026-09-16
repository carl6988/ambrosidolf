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

export async function updateAccountPlan(
  formData: FormData
): Promise<ActionResult> {
  const accountId = String(formData.get("accountId") ?? "").trim();
  const dailyPostsPlanRaw = String(formData.get("dailyPostsPlan") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!accountId) {
    return { error: "Account fehlt." };
  }

  const dailyPostsPlan = dailyPostsPlanRaw ? Number(dailyPostsPlanRaw) : 0;
  if (!Number.isInteger(dailyPostsPlan) || dailyPostsPlan < 0) {
    return { error: "Daily Posts Plan muss eine positive Ganzzahl sein." };
  }

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { creatorId: true },
  });
  if (!account) {
    return { error: "Account nicht gefunden." };
  }

  await prisma.account.update({
    where: { id: accountId },
    data: { dailyPostsPlan, notes: notes || null },
  });

  revalidatePath(`/creators/${account.creatorId}/management`);
  revalidatePath(`/creators/${account.creatorId}`);
  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}

export async function addRecoveryAccount(
  formData: FormData
): Promise<ActionResult> {
  const creatorId = String(formData.get("creatorId") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!creatorId || !username) {
    return { error: "Bitte einen Usernamen angeben." };
  }

  await prisma.creatorRecoveryAccount.create({
    data: { creatorId, username, note: note || null },
  });

  revalidatePath(`/creators/${creatorId}/management`);
  return { success: true };
}

export async function deleteRecoveryAccount(
  recoveryAccountId: string
): Promise<ActionResult> {
  const recoveryAccount = await prisma.creatorRecoveryAccount.findUnique({
    where: { id: recoveryAccountId },
    select: { creatorId: true },
  });
  if (!recoveryAccount) {
    return { error: "Nicht gefunden." };
  }

  await prisma.creatorRecoveryAccount.delete({ where: { id: recoveryAccountId } });

  revalidatePath(`/creators/${recoveryAccount.creatorId}/management`);
  return { success: true };
}
