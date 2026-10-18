"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

// Perfil e setores do técnico. Pelo cliente do usuário: o banco confere que quem altera é admin.
export async function saveUserAccess(_: ActionResult, form: FormData): Promise<ActionResult> {
  const me = await requireMe(["admin"]);
  const profileId = str(form, "id");
  const role = str(form, "role") as Role | null;
  const fullName = str(form, "full_name");
  if (!profileId || !role || !(role in ROLE)) return { error: "Dados inválidos." };
  if (!fullName) return { error: "Informe o nome." };
  if (profileId === me.id && role !== "admin") return { error: "Você não pode tirar o próprio acesso de administrador." };
  const areaIds = form.getAll("area_id").map(String).filter((v) => /^[0-9a-f-]{36}$/.test(v));

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role, full_name: fullName }).eq("id", profileId);
  if (error) return { error: "Não foi possível salvar o perfil." };

  // setores só fazem sentido para técnico; para os outros perfis a lista fica vazia
  const keep = role === "technician" ? areaIds : [];
  const { data: current } = await supabase.from("profile_areas").select("area_id").eq("profile_id", profileId);
  const have = new Set((current ?? []).map((r) => r.area_id));
  const toAdd = keep.filter((a) => !have.has(a));
  const toRemove = [...have].filter((a) => !keep.includes(a));
  if (toAdd.length) {
    const { error: e } = await supabase.from("profile_areas").insert(toAdd.map((area_id) => ({ profile_id: profileId, area_id })));
    if (e) return { error: "Não foi possível salvar os setores." };
  }
  if (toRemove.length) {
    const { error: e } = await supabase.from("profile_areas").delete().eq("profile_id", profileId).in("area_id", toRemove);
    if (e) return { error: "Não foi possível salvar os setores." };
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
