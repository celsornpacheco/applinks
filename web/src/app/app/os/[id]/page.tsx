import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OctagonAlert } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import { BUCKET_EVIDENCE, BUCKET_SIGNATURES } from "@/lib/buckets";
import { fmtDate, fmtDateTime, slaState } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { KindBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import type { Priority, WorkOrderKind, WorkOrderStatus } from "@/lib/domain";
import { ExecutePanel } from "./execute-panel";

export const metadata: Metadata = { title: "Ordem de serviço" };

export default async function MobileWorkOrderPage({ params }: PageProps<"/app/os/[id]">) {
  const { id } = await params;
  const me = await requireMe();
  const supabase = await createClient();
  const { data: wo } = await supabase
    .from("work_orders")
    .select("*, assets(id, tag, name, areas(name)), categories(name), opener:profiles!work_orders_opened_by_fkey(full_name), work_order_technicians(profiles(id, full_name))")
    .eq("id", id)
    .maybeSingle();
  if (!wo) notFound();

  const [{ data: attachments }, { data: signatures }, { data: settings }] = await Promise.all([
    supabase.from("attachments").select("id, storage_path, created_at").eq("work_order_id", id).order("created_at"),
    supabase.from("signatures").select("signer_role, signer_name, storage_path, signed_at").eq("work_order_id", id),
    supabase.from("settings").select("require_signature").maybeSingle(),
  ]);
  const photoUrls = await signedUrls(supabase, BUCKET_EVIDENCE, (attachments ?? []).map((a) => a.storage_path));
  const techSig = signatures?.find((s) => s.signer_role === "technician");
  const sigUrls = await signedUrls(supabase, BUCKET_SIGNATURES, techSig ? [techSig.storage_path] : []);

  const technicians = wo.work_order_technicians.map((t) => t.profiles).filter(Boolean) as { id: string; full_name: string }[];
  const canWork = me.role !== "requester";
  const sla = slaState(wo);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="font-mono text-sm text-muted">OS #{wo.number}</p>
        <h1 className="text-xl break-words">{wo.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={wo.status as WorkOrderStatus} />
          <KindBadge kind={wo.kind as WorkOrderKind} />
          <PriorityBadge priority={wo.priority as Priority} />
          {sla && <SlaBadge state={sla.state} remaining={sla.label} />}
        </div>
      </div>

      {wo.machine_stopped && (
        <p className="flex items-center gap-2 rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">
          <OctagonAlert className="size-4" aria-hidden />Máquina parada
        </p>
      )}

      <Card className="p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="col-span-2">
            <dt className="text-xs text-muted">Equipamento</dt>
            <dd>{wo.assets ? `${wo.assets.tag} · ${wo.assets.name}` : "—"}</dd>
            {wo.assets?.areas?.name && <dd className="text-xs font-normal text-muted">{wo.assets.areas.name}</dd>}
          </div>
          <div>
            <dt className="text-xs text-muted">{wo.kind === "preventive" ? "Prevista para" : "Aberta em"}</dt>
            <dd>{wo.kind === "preventive" ? fmtDate(wo.scheduled_for) : fmtDateTime(wo.opened_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Aberta por</dt>
            <dd>{wo.opener?.full_name ?? (wo.kind === "preventive" ? "Plano preventivo" : "—")}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted">Técnicos</dt>
            <dd>{technicians.length ? technicians.map((t) => t.full_name).join(", ") : "Ainda não atribuída"}</dd>
          </div>
          {wo.description && (
            <div className="col-span-2">
              <dt className="text-xs text-muted">Detalhes</dt>
              <dd className="whitespace-pre-wrap">{wo.description}</dd>
            </div>
          )}
          {wo.completed_at && (
            <div className="col-span-2">
              <dt className="text-xs text-muted">Concluída em</dt>
              <dd>{fmtDateTime(wo.completed_at)}</dd>
            </div>
          )}
        </dl>
      </Card>

      <ExecutePanel
        wo={{ id: wo.id, number: wo.number, status: wo.status as WorkOrderStatus }}
        me={{ id: me.id, name: me.fullName }}
        canWork={canWork}
        requireSignature={settings?.require_signature ?? true}
        photos={(attachments ?? []).map((a) => ({ id: a.id, url: photoUrls.get(a.storage_path) ?? "" }))}
        signature={techSig ? { name: techSig.signer_name, url: sigUrls.get(techSig.storage_path) ?? "", at: fmtDateTime(techSig.signed_at) } : null}
      />
    </div>
  );
}
