import type { Metadata } from "next";
import Link from "next/link";
import { Factory, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { CriticalityBadge, Badge } from "@/components/ui/badge";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import type { Criticality } from "@/lib/domain";

export const metadata: Metadata = { title: "Equipamentos" };

export default async function AssetsPage({ searchParams }: PageProps<"/ativos">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const area = typeof sp.setor === "string" ? sp.setor : "";
  const supabase = await createClient();

  let query = supabase
    .from("assets")
    .select("id, tag, name, manufacturer, model, criticality, status, areas(name), systems(name)")
    .order("tag");
  if (q) query = query.or(`tag.ilike.%${q.replace(/[%,()]/g, "")}%,name.ilike.%${q.replace(/[%,()]/g, "")}%`);
  if (area) query = query.eq("area_id", area);

  const [{ data: assets, error }, { data: areas }] = await Promise.all([
    query,
    supabase.from("areas").select("id, name").eq("active", true).order("name"),
  ]);
  const filtered = Boolean(q || area);

  return (
    <>
      <PageHeader
        title="Equipamentos"
        description={assets ? `${assets.length} ${assets.length === 1 ? "equipamento" : "equipamentos"}` : undefined}
        actions={
          <Link href="/ativos/novo" className={buttonVariants()}>
            <Plus aria-hidden />Novo equipamento
          </Link>
        }
      />

      <form className="mb-4 flex flex-wrap gap-3" role="search">
        <div className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input name="q" defaultValue={q} placeholder="Buscar por tag ou nome" className="pl-9" aria-label="Buscar equipamento" />
        </div>
        <div className="w-56">
          <Select name="setor" defaultValue={area} aria-label="Setor">
            <option value="">Todos os setores</option>
            {areas?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </div>
        <button className={buttonVariants({ variant: "secondary" })}>Filtrar</button>
      </form>

      {error ? (
        <Card><p role="alert" className="p-6 text-danger">Não foi possível carregar os equipamentos.</p></Card>
      ) : !assets?.length ? (
        <Card>
          <EmptyState
            icon={Factory}
            title={filtered ? "Nenhum equipamento com esses filtros" : "Nenhum equipamento cadastrado"}
            description={filtered ? "Tente outra busca ou outro setor." : "Cadastre as máquinas da fábrica para abrir chamados e planejar preventivas."}
            action={
              filtered ? (
                <Link href="/ativos" className={buttonVariants({ variant: "secondary", size: "sm" })}>Limpar filtros</Link>
              ) : (
                <Link href="/ativos/novo" className={buttonVariants({ size: "sm" })}>Cadastrar o primeiro</Link>
              )
            }
          />
        </Card>
      ) : (
        <Table caption="Equipamentos">
          <thead>
            <tr><Th>Tag</Th><Th>Equipamento</Th><Th>Setor</Th><Th>Sistema</Th><Th>Criticidade</Th><Th>Situação</Th></tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <Tr key={a.id}>
                <Td className="font-mono whitespace-nowrap">
                  <Link href={`/ativos/${a.id}`} className="font-semibold text-accent hover:underline">{a.tag}</Link>
                </Td>
                <Td>
                  <p className="max-w-80 truncate">{a.name}</p>
                  {(a.manufacturer || a.model) && (
                    <p className="text-xs font-normal text-muted">{[a.manufacturer, a.model].filter(Boolean).join(" · ")}</p>
                  )}
                </Td>
                <Td>{a.areas?.name ?? "—"}</Td>
                <Td>{a.systems?.name ?? "—"}</Td>
                <Td><CriticalityBadge criticality={a.criticality as Criticality} /></Td>
                <Td>{a.status === "active" ? <Badge tone="done">Ativo</Badge> : <Badge>Inativo</Badge>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
