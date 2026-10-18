import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, Plus } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkOrderCard } from "@/components/work-order-card";

export const metadata: Metadata = { title: "Minhas OS" };

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const RANK: Record<string, number> = { urgent: 3, high: 2, medium: 1, low: 0 };

const SELECT = "id, number, kind, title, status, priority, opened_at, scheduled_for, resolution_due_at, machine_stopped, assets(tag, name)";

export default async function MyWorkOrdersPage() {
  const me = await requireMe();
  const supabase = await createClient();

  // Solicitante: os chamados que abriu. Técnico: o banco já devolve só as OS dele e das áreas dele.
  if (me.role === "requester") {
    const { data } = await supabase.from("work_orders").select(SELECT).eq("opened_by", me.id).order("opened_at", { ascending: false }).limit(50);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl">Meus chamados</h1>
          <Link href="/app/chamado" className={buttonVariants({ size: "sm" })}><Plus aria-hidden />Abrir chamado</Link>
        </div>
        {data?.length ? (
          data.map((wo) => <WorkOrderCard key={wo.id} wo={wo} href={`/app/os/${wo.id}`} />)
        ) : (
          <EmptyState icon={ClipboardCheck} title="Nenhum chamado aberto" description="Leia o QR Code da máquina ou toque em Abrir chamado." />
        )}
      </div>
    );
  }

  const { data, error } = await supabase
    .from("work_orders")
    .select(SELECT)
    .not("status", "in", "(done,cancelled)")
    .order("opened_at")
    .limit(100);

  // urgente primeiro; o banco ordenaria o texto em ordem alfabética
  const rows = (data ?? []).sort((a, b) => (RANK[b.priority] ?? 0) - (RANK[a.priority] ?? 0));
  const d = today();
  const late = rows.filter((w) => (w.scheduled_for && w.scheduled_for < d) || (w.resolution_due_at && w.resolution_due_at < new Date().toISOString()));
  const now = rows.filter((w) => !late.includes(w) && (!w.scheduled_for || w.scheduled_for === d));
  const next = rows.filter((w) => !late.includes(w) && !now.includes(w));

  const groups = [
    { title: "Atrasadas", items: late },
    { title: "Hoje", items: now },
    { title: "Próximas", items: next },
  ].filter((g) => g.items.length);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl">Minhas OS</h1>
      {error && <p role="alert" className="text-danger">Não foi possível carregar as OS.</p>}
      {!groups.length && !error && (
        <EmptyState icon={ClipboardCheck} title="Nada pendente" description="Quando uma OS for atribuída a você ou ao seu setor, ela aparece aqui." />
      )}
      {groups.map((g) => (
        <section key={g.title} className="flex flex-col gap-3" aria-labelledby={`g-${g.title}`}>
          <h2 id={`g-${g.title}`} className="text-sm text-muted">{g.title} · {g.items.length}</h2>
          {g.items.map((wo) => <WorkOrderCard key={wo.id} wo={wo} href={`/app/os/${wo.id}`} />)}
        </section>
      ))}
    </div>
  );
}
