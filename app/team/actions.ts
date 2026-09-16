"use server";

import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ActionResult = { error?: string; success?: true };

export async function createUser(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Nur Admins können Mitarbeiter hinzufügen." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const isAdmin = formData.get("isAdmin") === "on";

  if (!name || !email || !password) {
    return { error: "Bitte alle Felder ausfüllen." };
  }
  if (password.length < 8) {
    return { error: "Passwort muss mindestens 8 Zeichen haben." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: `E-Mail "${email}" ist bereits vergeben.` };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: { name, email, passwordHash, isAdmin },
  });

  revalidatePath("/team");
  return { success: true };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return { error: "Nur Admins können Mitarbeiter entfernen." };
  }
  if (session.user.id === userId) {
    return { error: "Du kannst dich nicht selbst entfernen." };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/team");
  return { success: true };
}
