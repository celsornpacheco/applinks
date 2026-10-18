"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMe } from "@/lib/auth";
import { PRIORITY, WORK_ORDER_STATUS, type Priority, type WorkOrderStatus } from "@/lib/domain";
import { explain, str, type ActionResult } from "./errors";

export async function openTicket(form: FormData): Promise<ActionResult> {
  const me = await requireMe();
  const supabase = await createClient();
  const assetId = str(form, "asset_id");
  const title = str(form, "title");
  const priority = (str(form, "priority") ?? "medium") as Priority;
  if (!assetId) return { error: "Escolha o equipamento." };
  if (!title) return { error: "Descreva o problema em poucas palavras." };
  if (!(priority in PRIORITY)) return { error: "Prioridade inválida." };

  const { data: asset } = await supabase.from("assets").select("id, area_id").eq("id", assetId).maybeSingle();
  if (!asset) return { error: "Equipamento não encontrado." };

  // id gerado aqui: a tela já sabe para onde ir e as fotos sobem em seguida
  const id = crypto.randomUUID();
  const origin = str(form, "origin");
  const { error } = await supabase.from("work_orders").insert({
    id,
    kind: "corrective",
    asset_id: asset.id,
    area_id: asset.area_id,
    category_id: str(form, "category_id"),
    title,
    description: str(form, "description"),
    priority,
    machine_stopped: form.get("machine_stopped") === "on",
    origin: origin === "qr" || origin === "app" ? origin : "web",
    opened_by: me.id,
  });
  if (error) return { error: explain(error) };
  revalidatePath("/os");
  revalidatePath("/app");
  return { ok: true, id };
}

export async function assignTechnician(workOrderId: string, profileId: string): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase.from("work_order_technicians").insert({ work_order_id: workOrderId, profile_id: profileId });
  if (error) return { error: error.code === "23505" ? "Esse técnico já está na OS." : explain(error) };
  revalidatePath(`/os/${workOrderId}`);
  return { ok: true };
}

export async function removeTechnician(workOrderId: string, profileId: string): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_order_technicians")
    .delete()
    .eq("work_order_id", workOrderId)
    .eq("profile_id", profileId);
  if (error) return { error: explain(error) };
  revalidatePath(`/os/${workOrderId}`);
  return { ok: true };
}

const ALLOWED_BY_STAFF: WorkOrderStatus[] = ["in_progress", "waiting_material", "done", "open"];

export async function setStatus(workOrderId: string, status: WorkOrderStatus): Promise<ActionResult> {
  await requireMe(["admin", "manager", "technician"]);
  if (!(status in WORK_ORDER_STATUS) || !ALLOWED_BY_STAFF.includes(status)) return { error: "Status inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("work_orders").update({ status }).eq("id", workOrderId).select("id");
  if (error) return { error: explain(error) };
  if (!data?.length) return { error: "OS não encontrada ou sem permissão." };
  revalidatePath(`/os/${workOrderId}`);
  revalidatePath(`/app/os/${workOrderId}`);
  revalidatePath("/app");
  return { ok: true };
}

export async function cancelWorkOrder(workOrderId: string, reason: string): Promise<ActionResult> {
  await requireMe(["admin", "manager"]);
  if (!reason.trim()) return { error: "Informe o motivo do cancelamento." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_orders")
    .update({ status: "cancelled", cancel_reason: reason.trim() })
    .eq("id", workOrderId);
  if (error) return { error: explain(error) };
  revalidatePath(`/os/${workOrderId}`);
  return { ok: true };
}
