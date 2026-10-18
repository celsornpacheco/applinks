"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { requireMe } from "@/lib/auth";
import { ROLE, type Role } from "@/lib/domain";
import { str, type ActionResult } from "./errors";

// Só o admin cria contas. Sem e-mail automático por enquanto: o admin define a senha inicial
// e passa para a pessoa (a fábrica não tem e-mail para todo operador).
export async function createUser(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin"]);
  const fullName = str(form, "full_name");
  const email = str(form, "email")?.toLowerCase();
  const password = String(form.get("password") ?? "");
  const role = (str(form, "role") ?? "requester") as Role;
  if (!fullName) return { error: "Informe o nome." };
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha inicial precisa ter pelo menos 8 caracteres." };
  if (!(role in ROLE)) return { error: "Perfil inválido." };

  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    return { error: /already|registered|exists/i.test(error?.message ?? "") ? "Esse e-mail já tem conta." : "Não foi possível criar a conta." };
  }
  const { error: pErr } = await admin.from("profiles").insert({ id: data.user.id, full_name: fullName, email, role });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Não foi possível criar o perfil." };
  }
  revalidatePath("/config/usuarios");
  return { ok: true };
}

export async function setUserActive(profileId: string, active: boolean): Promise<ActionResult> {
  const me = await requireMe(["admin"]);
  if (profileId === me.id) return { error: "Você não pode desativar a própria conta." };
  const admin = createServiceClient();
  const { error } = await admin.from("profiles").update({ active }).eq("id", profileId);
  // desativado perde o acesso na próxima ação: getMe() e as regras do banco exigem perfil ativo
  if (error) return { error: "Não foi possível alterar." };
  revalidatePath("/config/usuarios");
  return { ok: true };
}
