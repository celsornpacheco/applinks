import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { NameForm } from "./name-form";
import { createArea, createSystem } from "@/lib/actions/assets";

export const metadata: Metadata = { title: "Setores e sistemas" };

export default async function LocationsPage() {
  const supabase = await createClient();
  const [{ data: sites }, { data: areas }, { data: systems }, { data: counts }] = await Promise.all([
    supabase.from("sites").select("id, name").order("name"),
    supabase.from("areas").select("id, name, site_id, active").order("name"),
    supabase.from("systems").select("id, name").order("name"),
    supabase.from("assets").select("area_id"),
  ]);
  const perArea = new Map<string, number>();
  for (const a of counts ?? []) perArea.set(a.area_id, (perArea.get(a.area_id) ?? 0) + 1);
  const site = sites?.[0];

  return (
    <>
      <PageHeader title="Setores e sistemas" back={{ href: "/config", label: "Configurações" }} description={site?.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Setores" />
          <ul className="divide-y divide-border">
            {(areas ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                {a.name}
                <span className="text-xs font-normal text-muted">{perArea.get(a.id) ?? 0} equipamento(s)</span>
              </li>
            ))}
            {!areas?.length && <li className="px-4 py-3 text-sm text-muted">Nenhum setor ainda.</li>}
          </ul>
          {site ? (
            <div className="border-t border-border p-4">
              <NameForm action={createArea} label="Novo setor" placeholder="Ex.: Injeção" hidden={{ site_id: site.id }} />
            </div>
          ) : (
            <p className="border-t border-border p-4 text-sm text-danger">Nenhuma unidade cadastrada. Fale com o administrador.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Sistemas" />
          <ul className="divide-y divide-border">
            {(systems ?? []).map((s) => <li key={s.id} className="px-4 py-3 text-sm">{s.name}</li>)}
            {!systems?.length && <li className="px-4 py-3 text-sm text-muted">Nenhum sistema ainda.</li>}
          </ul>
          <div className="border-t border-border p-4">
            <NameForm action={createSystem} label="Novo sistema" placeholder="Ex.: Hidráulico" />
          </div>
        </Card>
      </div>
    </>
  );
}
