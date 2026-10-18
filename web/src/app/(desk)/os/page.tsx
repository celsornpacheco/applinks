import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { WorkOrderTable } from "@/components/work-order-table";
import { PRIORITY, WORK_ORDER_KIND, WORK_ORDER_STATUS } from "@/lib/domain";

export const metadata: Metadata = { title: "Ordens de serviço" };

const VIEWS = {
  abertas: { label: "Em aberto", statuses: ["open", "assigned", "in_progress", "waiting_material"] },
  concluidas: { label: "Concluídas", statuses: ["done"] },
  canceladas: { label: "Canceladas", statuses: ["cancelled"] },
  todas: { label: "Todas", statuses: null },
} as const;
type View = keyof typeof VIEWS;

export default async function WorkOrdersPage({ searchParams }: PageProps<"/os">) {
  const sp = await searchParams;
  const view: View = typeof sp.ver === "string" && sp.ver in VIEWS ? (sp.ver as View) : "abertas";
  const kind = typeof sp.tipo === "string" && sp.tipo in WORK_ORDER_KIND ? sp.tipo : "";
  const priority = typeof sp.prioridade === "string" && sp.prioridade in PRIORITY ? sp.prioridade : "";
  const status = typeof sp.status === "string" && sp.status in WORK_ORDER_STATUS ? sp.status : "";
  const tech = typeof sp.tecnico === "string" && /^[0-9a-f-]{36}$/.test(sp.tecnico) ? sp.tecnico : "";
  const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const from = isDate(sp.de) ? sp.de : "";
  const to = isDate(sp.ate) ? sp.ate : "";

  const supabase = await createClient();
  const { data: technicians } = await supabase.from("profiles").select("id, full_name").eq("role", "technician").order("full_name");
  // OS do técnico escolhido (atribuições), antes da consulta principal
  const techIds = tech
    ? ((await supabase.from("work_order_technicians").select("work_order_id").eq("profile_id", tech)).data ?? []).map((r) => r.work_order_id)
    : null;
  let q = supabase
    .from("work_orders")
    .select("id, number, kind, title, status, priority, opened_at, scheduled_for, resolution_due_at, assets(tag, name)")
    .order("opened_at", { ascending: false })
    .limit(200);
  const statuses = VIEWS[view].statuses;
  if (status) q = q.eq("status", status);
  else if (statuses) q = q.in("status", [...statuses]);
  if (kind) q = q.eq("kind", kind);
  if (priority) q = q.eq("priority", priority);
  if (techIds) q = q.in("id", techIds.length ? techIds : ["00000000-0000-0000-0000-000000000000"]);
  // período pela data de abertura, no fuso de Brasília
  if (from) q = q.gte("opened_at", `${from}T00:00:00-03:00`);
  if (to) q = q.lte("opened_at", `${to}T23:59:59.999-03:00`);
  const { data, error } = await q;

  const filtered = Boolean(kind || priority || status || tech || from || to);
  const keep = new URLSearchParams(Object.entries({ tipo: kind, prioridade: priority, tecnico: tech, de: from, ate: to }).filter(([, v]) => v));
  const qs = (v: View) => `/os?ver=${v}${keep.size ? `&${keep}` : ""}`;

  return (
    <>
      <PageHeader
        title="Ordens de serviço"
        description={data ? `${data.length} OS` : undefined}
        actions={<Link href="/os/nova" className={buttonVariants()}><Plus aria-hidden />Nova OS</Link>}
      />

      <nav aria-label="Visões" className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={qs(v)}
            aria-current={v === view ? "page" : undefined}
            className="-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted hover:text-fg aria-[current=page]:border-accent aria-[current=page]:text-fg"
          >
            {VIEWS[v].label}
          </Link>
        ))}
      </nav>

      <form className="mb-4 flex flex-wrap gap-3">
        <input type="hidden" name="ver" value={view} />
        <div className="w-44">
          <Select name="tipo" defaultValue={kind} aria-label="Tipo">
            <option value="">Todos os tipos</option>
            {Object.entries(WORK_ORDER_KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
        <div className="w-44">
          <Select name="prioridade" defaultValue={priority} aria-label="Prioridade">
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
        <div className="w-48">
          <Select name="status" defaultValue={status} aria-label="Status">
            <option value="">Status da visão</option>
            {Object.entries(WORK_ORDER_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
        </div>
        <div className="w-48">
          <Select name="tecnico" defaultValue={tech} aria-label="Técnico">
            <option value="">Todos os técnicos</option>
            {technicians?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" name="de" defaultValue={from} aria-label="Aberta de" className="w-40" />
          <span className="text-sm text-muted">até</span>
          <Input type="date" name="ate" defaultValue={to} aria-label="Aberta até" className="w-40" />
        </div>
        <button className={buttonVariants({ variant: "secondary" })}>Filtrar</button>
        {filtered && <Link href={`/os?ver=${view}`} className={buttonVariants({ variant: "ghost" })}>Limpar</Link>}
      </form>

      {error ? (
        <Card><p role="alert" className="p-6 text-danger">Não foi possível carregar as OS.</p></Card>
      ) : !data?.length ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={filtered ? "Nenhuma OS com esses filtros" : view === "abertas" ? "Nenhuma OS em aberto" : "Nenhuma OS aqui"}
            description={view === "abertas" && !filtered ? "Chamados abertos pelo QR e preventivas do dia aparecem aqui." : undefined}
          />
        </Card>
      ) : (
        <WorkOrderTable rows={data} caption="Ordens de serviço" />
      )}
    </>
  );
}
