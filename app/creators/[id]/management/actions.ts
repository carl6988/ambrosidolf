"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type ActionResult = { error?: string; success?: true };

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

function textOrNull(formData: FormData, field: string): string | null {
  const value = String(formData.get(field) ?? "").trim();
  return value || null;
}

export async function upsertPhoneLogin(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "").trim();
  const creatorId = String(formData.get("creatorId") ?? "").trim();
  const phoneLabel = String(formData.get("phoneLabel") ?? "").trim();

  if (!creatorId || !phoneLabel) {
    return { error: "Bitte mindestens eine Phone-Bezeichnung angeben." };
  }

  const data = {
    phoneLabel,
    phoneNumber: textOrNull(formData, "phoneNumber"),
    phoneOwner: textOrNull(formData, "phoneOwner"),
    media: textOrNull(formData, "media"),
    accountUsername: textOrNull(formData, "accountUsername"),
    accountPassword: textOrNull(formData, "accountPassword"),
    gmailAppleId: textOrNull(formData, "gmailAppleId"),
    gmailApplePassword: textOrNull(formData, "gmailApplePassword"),
    gmailCreatedOnPhone: textOrNull(formData, "gmailCreatedOnPhone"),
    simPin: textOrNull(formData, "simPin"),
    note: textOrNull(formData, "note"),
  };

  if (id) {
    await prisma.creatorPhoneLogin.update({ where: { id }, data });
  } else {
    await prisma.creatorPhoneLogin.create({ data: { creatorId, ...data } });
  }

  revalidatePath(`/creators/${creatorId}/management`);
  return { success: true };
}

export async function deletePhoneLogin(phoneLoginId: string): Promise<ActionResult> {
  const phoneLogin = await prisma.creatorPhoneLogin.findUnique({
    where: { id: phoneLoginId },
    select: { creatorId: true },
  });
  if (!phoneLogin) {
    return { error: "Nicht gefunden." };
  }

  await prisma.creatorPhoneLogin.delete({ where: { id: phoneLoginId } });

  revalidatePath(`/creators/${phoneLogin.creatorId}/management`);
  return { success: true };
}
