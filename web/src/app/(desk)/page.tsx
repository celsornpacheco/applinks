import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, KpiCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkOrderTable } from "@/components/work-order-table";
import { daysAgoIso, slaState } from "@/lib/format";

export const metadata: Metadata = { title: "Painel" };

// Painel provisório da fatia vertical: o painel completo (gráficos e filtros) vem na entrega 3
export default async function DashboardPage() {
  const supabase = await createClient();
  const since = daysAgoIso(30);
  const [{ data: open }, { count: doneMonth }, { data: mttr }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, number, kind, title, status, priority, opened_at, scheduled_for, resolution_due_at, machine_stopped, assets(tag, name)")
      .not("status", "in", "(done,cancelled)")
      .order("opened_at", { ascending: false })
      .limit(100),
    supabase.from("work_orders").select("id", { count: "exact", head: true }).eq("status", "done").gte("completed_at", since),
    supabase.from("v_asset_mttr").select("mttr_hours, repairs"),
  ]);

  const rows = open ?? [];
  const breached = rows.filter((w) => slaState(w)?.state === "breached").length;
  const stopped = rows.filter((w) => w.machine_stopped).length;
  const repairs = (mttr ?? []).reduce((s, r) => s + (r.repairs ?? 0), 0);
  const avg = repairs ? (mttr ?? []).reduce((s, r) => s + (r.mttr_hours ?? 0) * (r.repairs ?? 0), 0) / repairs : null;

  return (
    <>
      <PageHeader title="Painel" description="Situação da manutenção agora." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="OS em aberto" value={String(rows.length)} />
        <KpiCard label="Máquinas paradas" value={String(stopped)} />
        <KpiCard label="SLA estourado" value={String(breached)} />
        <KpiCard label="MTTR geral" value={avg != null ? `${avg.toFixed(1).replace(".", ",")} h` : "—"} />
      </div>
      <Card>
        <CardHeader
          title="OS em aberto"
          action={<Link href="/os" className="text-sm font-semibold text-accent hover:underline">Ver todas</Link>}
        />
        {rows.length ? (
          <div className="p-3"><WorkOrderTable rows={rows.slice(0, 10)} caption="OS em aberto" /></div>
        ) : (
          <EmptyState icon={ClipboardList} title="Tudo em dia" description={`${doneMonth ?? 0} OS concluídas nos últimos 30 dias.`} />
        )}
      </Card>
    </>
  );
}
