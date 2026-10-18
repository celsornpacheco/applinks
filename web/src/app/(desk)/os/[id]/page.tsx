import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OctagonAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import { BUCKET_EVIDENCE, BUCKET_SIGNATURES } from "@/lib/buckets";
import { fmtDate, fmtDateTime, fmtDuration, slaState } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { KindBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { WORK_ORDER_STATUS, type Priority, type WorkOrderKind, type WorkOrderStatus } from "@/lib/domain";
import { ManagePanel } from "./manage-panel";

export const metadata: Metadata = { title: "Ordem de serviço" };

const EVENT_LABEL: Record<string, string> = {
  created: "OS criada",
  assigned: "Técnico atribuído",
  status: "Status alterado",
  reopened: "OS reaberta",
  rated: "Atendimento avaliado",
};

export default async function WorkOrderPage({ params }: PageProps<"/os/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: wo } = await supabase
    .from("work_orders")
    .select("*, assets(id, tag, name, areas(name)), categories(name), opener:profiles!work_orders_opened_by_fkey(full_name), work_order_technicians(profiles(id, full_name))")
    .eq("id", id)
    .maybeSingle();
  if (!wo) notFound();

  const [{ data: attachments }, { data: signatures }, { data: events }, { data: technicians }] = await Promise.all([
    supabase.from("attachments").select("id, storage_path, created_at, profiles(full_name)").eq("work_order_id", id).order("created_at"),
    supabase.from("signatures").select("signer_role, signer_name, storage_path, signed_at").eq("work_order_id", id),
    supabase.from("work_order_events").select("id, kind, from_value, to_value, note, created_at, profiles(full_name)").eq("work_order_id", id).order("created_at"),
    supabase.from("profiles").select("id, full_name").eq("role", "technician").eq("active", true).order("full_name"),
  ]);
  const photoUrls = await signedUrls(supabase, BUCKET_EVIDENCE, (attachments ?? []).map((a) => a.storage_path));
  const sigUrls = await signedUrls(supabase, BUCKET_SIGNATURES, (signatures ?? []).map((s) => s.storage_path));

  const assigned = wo.work_order_technicians.map((t) => t.profiles).filter(Boolean) as { id: string; full_name: string }[];
  const names = new Map([...(technicians ?? []), ...assigned].map((p) => [p.id, p.full_name]));
  const sla = slaState(wo);
  const repairTime = wo.completed_at ? fmtDuration(new Date(wo.completed_at).getTime() - new Date(wo.opened_at).getTime()) : null;

  return (
    <>
      <PageHeader
        title={`OS #${wo.number} · ${wo.title}`}
        back={{ href: "/os", label: "Ordens de serviço" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={wo.status as WorkOrderStatus} />
            <KindBadge kind={wo.kind as WorkOrderKind} />
            <PriorityBadge priority={wo.priority as Priority} />
            {sla && <SlaBadge state={sla.state} remaining={sla.label} />}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          {wo.machine_stopped && (
            <p className="flex items-center gap-2 rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">
              <OctagonAlert className="size-4" aria-hidden />Máquina parada
            </p>
          )}
          <Card>
            <CardHeader title="Dados" />
            <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">Equipamento</dt>
                <dd className="text-sm">
                  {wo.assets ? (
                    <Link href={`/ativos/${wo.assets.id}`} className="text-accent hover:underline">{wo.assets.tag} · {wo.assets.name}</Link>
                  ) : "—"}
                  {wo.assets?.areas?.name && <span className="text-muted"> · {wo.assets.areas.name}</span>}
                </dd>
              </div>
              {[
                ["Categoria", wo.categories?.name],
                ["Aberta por", wo.opener?.full_name ?? (wo.kind === "preventive" ? "Plano preventivo" : null)],
                [wo.kind === "preventive" ? "Prevista para" : "Aberta em", wo.kind === "preventive" ? fmtDate(wo.scheduled_for) : fmtDateTime(wo.opened_at)],
                ["Prazo de solução", wo.resolution_due_at ? fmtDateTime(wo.resolution_due_at) : null],
                ["Início do atendimento", wo.started_at ? fmtDateTime(wo.started_at) : null],
                ["Concluída em", wo.completed_at ? `${fmtDateTime(wo.completed_at)} (${repairTime})` : null],
                ["Motivo do cancelamento", wo.cancel_reason],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l as string}>
                  <dt className="text-xs text-muted">{l}</dt>
                  <dd className="text-sm">{v}</dd>
                </div>
              ))}
              {wo.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted">Detalhes</dt>
                  <dd className="text-sm whitespace-pre-wrap">{wo.description}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title={`Fotos (${attachments?.length ?? 0})`} />
            {attachments?.length ? (
              <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
                {attachments.map((a, i) => (
                  <li key={a.id}>
                    <a href={photoUrls.get(a.storage_path)} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element -- link assinado temporário */}
                      <img src={photoUrls.get(a.storage_path)} alt={`Foto ${i + 1}`} className="aspect-square w-full rounded-md bg-neutral-bg object-cover" />
                    </a>
                    <p className="mt-1 text-xs font-normal text-muted">{a.profiles?.full_name} · {fmtDateTime(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-muted">Nenhuma foto.</p>
            )}
          </Card>

          {signatures?.length ? (
            <Card>
              <CardHeader title="Assinaturas" />
              <div className="grid gap-4 p-4 sm:grid-cols-2">
                {signatures.map((s) => (
                  <figure key={s.signer_role}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- link assinado temporário */}
                    <img src={sigUrls.get(s.storage_path)} alt={`Assinatura de ${s.signer_name}`} className="h-28 w-full rounded-md border border-border object-contain" />
                    <figcaption className="mt-1 text-xs font-normal text-muted">
                      {s.signer_role === "technician" ? "Técnico" : "Responsável"}: {s.signer_name} · {fmtDateTime(s.signed_at)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <ManagePanel
            wo={{ id: wo.id, number: wo.number, status: wo.status as WorkOrderStatus }}
            assigned={assigned}
            technicians={technicians ?? []}
          />
          <Card>
            <CardHeader title="Linha do tempo" />
            <ol className="flex flex-col gap-3 p-4">
              {(events ?? []).map((e) => (
                <li key={e.id} className="border-l-2 border-border pl-3">
                  <p className="text-sm">
                    {EVENT_LABEL[e.kind] ?? e.kind}
                    {e.kind === "status" || e.kind === "reopened" ? `: ${WORK_ORDER_STATUS[e.to_value as WorkOrderStatus] ?? e.to_value}` : ""}
                    {e.kind === "assigned" ? `: ${names.get(e.to_value ?? "") ?? "técnico"}` : ""}
                    {e.kind === "rated" ? `: ${e.to_value}/5` : ""}
                  </p>
                  <p className="text-xs font-normal text-muted">{fmtDateTime(e.created_at)}{e.profiles?.full_name ? ` · ${e.profiles.full_name}` : ""}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
