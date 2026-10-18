import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Wrench } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CriticalityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkOrderCard } from "@/components/work-order-card";
import type { Criticality } from "@/lib/domain";

export const metadata: Metadata = { title: "Equipamento" };

// Ficha do equipamento em campo (depois de ler o QR): dados, OS abertas e últimas concluídas
export default async function MobileAssetPage({ params }: PageProps<"/app/ativo/[id]">) {
  await requireMe();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: asset }, { data: orders }] = await Promise.all([
    supabase.from("assets").select("id, tag, name, manufacturer, model, serial_number, criticality, areas(name), systems(name)").eq("id", id).maybeSingle(),
    supabase
      .from("work_orders")
      .select("id, number, kind, title, status, priority, opened_at, scheduled_for, resolution_due_at, machine_stopped")
      .eq("asset_id", id)
      .order("opened_at", { ascending: false })
      .limit(15),
  ]);
  if (!asset) notFound();
  const open = (orders ?? []).filter((o) => o.status !== "done" && o.status !== "cancelled");
  const recent = (orders ?? []).filter((o) => o.status === "done").slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-sm text-muted">{asset.tag}</p>
        <h1 className="text-xl break-words">{asset.name}</h1>
        <div><CriticalityBadge criticality={asset.criticality as Criticality} /></div>
      </div>

      <Card className="p-4">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          {[
            ["Setor", asset.areas?.name],
            ["Sistema", asset.systems?.name],
            ["Fabricante", asset.manufacturer],
            ["Modelo", asset.model],
            ["Nº de série", asset.serial_number],
          ].map(([l, v]) => (
            <div key={l as string}>
              <dt className="text-xs text-muted">{l}</dt>
              <dd className="break-words">{v ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Link href={`/app/chamado?ativo=${asset.id}`} className={buttonVariants({ size: "lg", block: true })}>
        <Wrench aria-hidden />Abrir chamado nesta máquina
      </Link>

      <section className="flex flex-col gap-3" aria-labelledby="abertas">
        <h2 id="abertas" className="text-sm text-muted">OS abertas · {open.length}</h2>
        {open.length ? (
          open.map((wo) => <WorkOrderCard key={wo.id} wo={wo} href={`/app/os/${wo.id}`} />)
        ) : (
          <Card><EmptyState icon={ClipboardList} title="Nenhuma OS aberta" /></Card>
        )}
      </section>

      {recent.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="recentes">
          <h2 id="recentes" className="text-sm text-muted">Últimas concluídas</h2>
          {recent.map((wo) => <WorkOrderCard key={wo.id} wo={wo} href={`/app/os/${wo.id}`} />)}
        </section>
      )}
    </div>
  );
}
