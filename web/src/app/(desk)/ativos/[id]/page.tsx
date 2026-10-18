import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, Pencil, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { assetQrPath, qrSvg, siteUrl } from "@/lib/qr";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge, CriticalityBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkOrderTable } from "@/components/work-order-table";
import type { Criticality } from "@/lib/domain";

export async function generateMetadata({ params }: PageProps<"/ativos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("assets").select("tag, name").eq("id", id).maybeSingle();
  return { title: data ? `${data.tag} · ${data.name}` : "Equipamento" };
}

export default async function AssetPage({ params }: PageProps<"/ativos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: asset } = await supabase
    .from("assets")
    .select("*, areas(name), systems(name), responsible:profiles(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!asset) notFound();

  const [{ data: orders }, { data: mttr }, { data: mtbf }] = await Promise.all([
    supabase
      .from("work_orders")
      .select("id, number, kind, title, status, priority, opened_at, scheduled_for, resolution_due_at")
      .eq("asset_id", id)
      .order("opened_at", { ascending: false })
      .limit(30),
    supabase.from("v_asset_mttr").select("mttr_hours, repairs").eq("asset_id", id).maybeSingle(),
    supabase.from("v_asset_mtbf").select("mtbf_hours").eq("asset_id", id).maybeSingle(),
  ]);

  const qrUrl = (await siteUrl()) + assetQrPath(asset.qr_token);
  const svg = await qrSvg(qrUrl);
  const details: [string, React.ReactNode][] = [
    ["Setor", asset.areas?.name],
    ["Sistema", asset.systems?.name],
    ["Fabricante", asset.manufacturer],
    ["Modelo", asset.model],
    ["Número de série", asset.serial_number],
    ["Ano", asset.year],
    ["Responsável", asset.responsible?.full_name],
  ];

  return (
    <>
      <PageHeader
        title={`${asset.tag} · ${asset.name}`}
        back={{ href: "/ativos", label: "Equipamentos" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CriticalityBadge criticality={asset.criticality as Criticality} />
            {asset.status === "active" ? <Badge tone="done">Ativo</Badge> : <Badge>Inativo</Badge>}
          </span>
        }
        actions={
          <Link href={`/ativos/${id}/editar`} className={buttonVariants({ variant: "secondary" })}>
            <Pencil aria-hidden />Editar
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Dados" />
            <dl className="grid gap-x-6 gap-y-3 p-4 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="text-sm">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <CardHeader title="Histórico de OS" />
            {orders?.length ? (
              <div className="p-3"><WorkOrderTable rows={orders} showAsset={false} caption={`Ordens de serviço de ${asset.tag}`} /></div>
            ) : (
              <EmptyState icon={ClipboardList} title="Nenhuma OS ainda" description="Chamados e preventivas deste equipamento aparecem aqui." />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-col items-center gap-3 p-4">
            <div className="w-44" role="img" aria-label={`QR Code do equipamento ${asset.tag}`} dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="text-center text-xs font-normal text-muted">Ao ler este código no celular, o operador abre um chamado e o técnico vê a ficha.</p>
            <Link href={`/etiquetas?ids=${id}`} target="_blank" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Printer aria-hidden />Imprimir etiqueta
            </Link>
          </Card>
          <Card className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <p className="text-xs text-muted">MTTR</p>
              <p className="text-xl tabular-nums">{mttr?.mttr_hours != null ? `${mttr.mttr_hours} h` : "—"}</p>
              <p className="text-xs font-normal text-muted">{mttr?.repairs ?? 0} reparo(s)</p>
            </div>
            <div className="p-4">
              <p className="text-xs text-muted">MTBF</p>
              <p className="text-xl tabular-nums">{mtbf?.mtbf_hours != null ? `${mtbf.mtbf_hours} h` : "—"}</p>
              <p className="text-xs font-normal text-muted">entre falhas</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
