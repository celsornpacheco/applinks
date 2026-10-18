import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { NameForm } from "../locais/name-form";
import { createCategory } from "@/lib/actions/settings";
import { CategoryRow, DefaultSlaForm, GeneralForm, OverrideForm, OverrideRow } from "./forms";

export const metadata: Metadata = { title: "Chamados e prazos" };

export default async function TicketSettingsPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: rules }, { data: settings }] = await Promise.all([
    supabase.from("categories").select("id, name, active").order("name"),
    supabase.from("sla_rules").select("id, category_id, priority, response_minutes, resolution_minutes, categories(name)"),
    supabase.from("settings").select("require_signature, sla_risk_percent").maybeSingle(),
  ]);
  const defaults = (rules ?? []).filter((r) => !r.category_id);
  const overrides = (rules ?? []).filter((r) => r.category_id);

  return (
    <>
      <PageHeader title="Chamados e prazos" back={{ href: "/config", label: "Configurações" }} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Prazos padrão (SLA)" />
          <div className="p-4">
            <p className="mb-4 text-sm text-muted">
              Contados a partir da abertura do chamado. Resposta: até alguém começar a cuidar. Solução: até a OS ser concluída.
            </p>
            <DefaultSlaForm rules={defaults} />
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Exceções por categoria" />
            <ul className="divide-y divide-border">
              {overrides.map((r) => <OverrideRow key={r.id} rule={r} />)}
              {!overrides.length && <li className="px-4 py-3 text-sm text-muted">Nenhuma exceção. Todas as categorias seguem o prazo padrão.</li>}
            </ul>
            <div className="border-t border-border p-4">
              <OverrideForm categories={(categories ?? []).filter((c) => c.active)} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Regras gerais" />
            <div className="p-4">
              <GeneralForm requireSignature={settings?.require_signature ?? true} riskPercent={settings?.sla_risk_percent ?? 80} />
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Categorias de chamado" />
          <ul className="divide-y divide-border">
            {(categories ?? []).map((c) => <CategoryRow key={c.id} category={c} />)}
          </ul>
          <div className="border-t border-border p-4">
            <NameForm action={createCategory} label="Nova categoria" placeholder="Ex.: Lubrificação" />
          </div>
        </Card>
      </div>
    </>
  );
}
