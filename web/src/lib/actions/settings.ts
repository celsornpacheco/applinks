"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMe } from "@/lib/auth";
import { PRIORITY, type Priority } from "@/lib/domain";
import { explain, str, type ActionResult } from "./errors";

const PATH = "/config/chamados";

// horas digitadas (aceita vírgula) -> minutos inteiros
function minutes(v: FormDataEntryValue | null) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 60) : null;
}

export async function createCategory(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const name = str(form, "name");
  if (!name) return { error: "Informe o nome da categoria." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name });
  if (error) return { error: error.code === "23505" ? "Já existe uma categoria com esse nome." : explain(error) };
  revalidatePath(PATH);
  return { ok: true };
}

export async function setCategoryActive(id: string, active: boolean): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("categories").update({ active }).eq("id", id);
  if (error) return { error: explain(error) };
  revalidatePath(PATH);
  return { ok: true };
}

// Prazos padrão (sem categoria), uma linha por prioridade
export async function saveDefaultSla(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const supabase = await createClient();
  const { data: existing } = await supabase.from("sla_rules").select("id, priority").is("category_id", null);
  for (const p of Object.keys(PRIORITY) as Priority[]) {
    const response = minutes(form.get(`${p}_response`));
    const resolution = minutes(form.get(`${p}_resolution`));
    if (!response || !resolution) return { error: `Informe os dois prazos da prioridade ${PRIORITY[p].toLowerCase()}.` };
    if (response > resolution) return { error: `Prioridade ${PRIORITY[p].toLowerCase()}: a resposta não pode demorar mais que a solução.` };
    const row = existing?.find((r) => r.priority === p);
    const { error } = row
      ? await supabase.from("sla_rules").update({ response_minutes: response, resolution_minutes: resolution }).eq("id", row.id)
      : await supabase.from("sla_rules").insert({ priority: p, response_minutes: response, resolution_minutes: resolution });
    if (error) return { error: explain(error) };
  }
  revalidatePath(PATH);
  return { ok: true };
}

// Exceção: categoria + prioridade com prazo próprio (ex.: Segurança é sempre rápido)
export async function addSlaOverride(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const categoryId = str(form, "category_id");
  const priority = str(form, "priority") as Priority | null;
  const response = minutes(form.get("response"));
  const resolution = minutes(form.get("resolution"));
  if (!categoryId || !priority || !(priority in PRIORITY)) return { error: "Escolha a categoria e a prioridade." };
  if (!response || !resolution) return { error: "Informe os dois prazos em horas." };
  if (response > resolution) return { error: "A resposta não pode demorar mais que a solução." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("sla_rules")
    .insert({ category_id: categoryId, priority, response_minutes: response, resolution_minutes: resolution });
  if (error) return { error: error.code === "23505" ? "Já existe uma exceção para essa categoria e prioridade." : explain(error) };
  revalidatePath(PATH);
  return { ok: true };
}

export async function removeSlaOverride(id: string): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("sla_rules").delete().eq("id", id).not("category_id", "is", null);
  if (error) return { error: explain(error) };
  revalidatePath(PATH);
  return { ok: true };
}

export async function saveGeneralSettings(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const risk = Number(form.get("sla_risk_percent"));
  if (!Number.isInteger(risk) || risk < 50 || risk > 99) return { error: "O aviso de risco deve ficar entre 50% e 99% do prazo." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({ require_signature: form.get("require_signature") === "on", sla_risk_percent: risk })
    .eq("id", true);
  if (error) return { error: explain(error) };
  revalidatePath(PATH);
  return { ok: true };
}
