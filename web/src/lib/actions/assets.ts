"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireMe } from "@/lib/auth";
import { CRITICALITY, type Criticality } from "@/lib/domain";
import { explain, str, type ActionResult } from "./errors";

export async function createArea(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const name = str(form, "name");
  const siteId = str(form, "site_id");
  if (!name || !siteId) return { error: "Informe o nome do setor." };
  const supabase = await createClient();
  const { error } = await supabase.from("areas").insert({ name, site_id: siteId, parent_id: str(form, "parent_id") });
  if (error) return { error: error.code === "23505" ? "Já existe um setor com esse nome." : explain(error) };
  revalidatePath("/config/locais");
  return { ok: true };
}

export async function createSystem(_: ActionResult, form: FormData): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const name = str(form, "name");
  if (!name) return { error: "Informe o nome do sistema." };
  const supabase = await createClient();
  const { error } = await supabase.from("systems").insert({ name });
  if (error) return { error: error.code === "23505" ? "Já existe um sistema com esse nome." : explain(error) };
  revalidatePath("/config/locais");
  return { ok: true };
}

export type AssetFormState = ActionResult & { fields?: Record<string, string> };

export async function saveAsset(_: AssetFormState, form: FormData): Promise<AssetFormState> {
  await requireMe(["admin", "manager"]);
  const fields = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const id = str(form, "id");
  const tag = str(form, "tag")?.toUpperCase();
  const name = str(form, "name");
  const areaId = str(form, "area_id");
  const criticality = (str(form, "criticality") ?? "medium") as Criticality;
  const yearRaw = str(form, "year");
  const year = yearRaw ? Number(yearRaw) : null;

  if (!tag) return { error: "Informe a tag do equipamento.", fields };
  if (!name) return { error: "Informe o nome do equipamento.", fields };
  if (!areaId) return { error: "Escolha o setor.", fields };
  if (!(criticality in CRITICALITY)) return { error: "Criticidade inválida.", fields };
  if (year != null && (!Number.isInteger(year) || year < 1950 || year > 2100)) return { error: "Ano inválido.", fields };

  const row = {
    tag,
    name,
    area_id: areaId,
    system_id: str(form, "system_id"),
    manufacturer: str(form, "manufacturer"),
    model: str(form, "model"),
    serial_number: str(form, "serial_number"),
    year,
    criticality,
  };
  const supabase = await createClient();
  const newId = id ?? crypto.randomUUID();
  const { error } = id
    ? await supabase.from("assets").update(row).eq("id", id)
    : await supabase.from("assets").insert({ ...row, id: newId });
  if (error) return { error: error.code === "23505" ? `Já existe um equipamento com a tag ${tag}.` : explain(error), fields };
  revalidatePath("/ativos");
  redirect(`/ativos/${newId}`);
}
