"use client";

import { useCallback, useState } from "react";
import { ClipboardList, Plus, QrCode, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Badge, CriticalityBadge, KindBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { Card, CardHeader, KpiCard } from "@/components/ui/card";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import { BottomNav, Sidebar } from "@/components/app-shell";
import { ChecklistItem, type AnswerValue, type ChecklistItemSpec } from "@/components/checklist-item";
import { SignatureField } from "@/components/signature-field";
import { CRITICALITY, PRIORITY, WORK_ORDER_STATUS, type Criticality, type Priority, type WorkOrderStatus } from "@/lib/domain";
import tokens from "./tokens.generated.json";

// classes literais: o Tailwind só gera o que aparece escrito no código
const typeClass: Record<string, string> = {
  xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", display: "text-display",
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-4 border-t border-border pt-8">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

const demoItems: ChecklistItemSpec[] = [
  { id: "1", label: "Pressão do sistema hidráulico", kind: "reading", min: 120, max: 160, unit: "bar", required: true, critical: true },
  { id: "2", label: "Vazamento visível nas mangueiras?", kind: "yes_no", required: true },
  { id: "3", label: "Estado da resistência do canhão", kind: "choice", options: ["Ok", "Desgastada", "Trocar"] },
  { id: "4", label: "Temperatura do óleo", kind: "reading", min: 30, max: 55, unit: "°C" },
  { id: "5", label: "Foto do painel elétrico", kind: "photo", required: true },
  { id: "6", label: "Observações", kind: "text" },
];

const demoOrders: { n: number; asset: string; title: string; status: WorkOrderStatus; priority: Priority; sla?: "ok" | "risk" | "breached" }[] = [
  { n: 1042, asset: "INJ-03 · Injetora 03", title: "Vazamento de óleo no cilindro", status: "in_progress", priority: "urgent", sla: "risk" },
  { n: 1041, asset: "SOP-02 · Sopradora PET 02", title: "Preventiva mensal", status: "assigned", priority: "medium" },
  { n: 1039, asset: "CMP-01 · Compressor parafuso", title: "Ruído no motor", status: "waiting_material", priority: "high", sla: "breached" },
  { n: 1035, asset: "CHL-01 · Chiller", title: "Preventiva trimestral", status: "done", priority: "low" },
];

export function Showcase() {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({ "1": 175, "4": 42 });
  const [photos, setPhotos] = useState<Record<string, number>>({});
  const [showMissing, setShowMissing] = useState(false);
  const onSignature = useCallback(() => {}, []);

  return (
    <div className="mx-auto flex max-w-[var(--layout-content-max)] flex-col gap-10 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-display">Sistema de design</h1>
        <p className="max-w-2xl text-base text-muted">
          Componentes do Inovapet Manutenção, com cores provisórias. Os valores vêm de{" "}
          <code className="font-mono text-sm">replica/design/tokens.json</code> e mudam no /replica-brand.
        </p>
      </header>

      <Section id="cores" title="Cores (papéis)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Object.entries(tokens.color).map(([name, hex]) => (
            <div key={name} className="overflow-hidden rounded-md border border-border bg-surface-raised">
              <div className="h-12" style={{ background: `var(--${name})` }} />
              <div className="px-2 py-1.5">
                <p className="text-xs">{name}</p>
                <p className="font-mono text-xs font-normal text-muted">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="tipografia" title="Tipografia">
        <div className="flex flex-col gap-2">
          {Object.entries(tokens.type).reverse().map(([name, s]) => (
            <p key={name} className={typeClass[name]}>
              <span className="mr-3 inline-block w-28 font-mono text-xs font-normal text-muted">
                {name} {s.size}/{s.line}
              </span>
              Injetora 03 · Pressão 142 bar
            </p>
          ))}
        </div>
      </Section>

      <Section id="botoes" title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button><Plus aria-hidden />Nova OS</Button>
          <Button variant="secondary">Exportar</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Excluir</Button>
          <Button disabled>Desabilitado</Button>
          <Button loading>Salvando</Button>
          <Button variant="secondary" size="icon" aria-label="Buscar"><Search aria-hidden /></Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeno 32</Button>
          <Button size="md">Médio 40</Button>
          <Button size="lg"><QrCode aria-hidden />Grande 48 (celular)</Button>
        </div>
      </Section>

      <Section id="campos" title="Campos de formulário">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tag do equipamento" required hint="Ex.: INJ-03. Aparece na etiqueta QR.">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} placeholder="INJ-03" />}
          </Field>
          <Field label="Nome" required error="Informe o nome do equipamento.">
            {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} />}
          </Field>
          <Field label="Criticidade">
            {({ id }) => (
              <Select id={id} defaultValue="high">
                {Object.entries(CRITICALITY).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            )}
          </Field>
          <Field label="Número de série" hint="Não editável depois da primeira OS.">
            {({ id, describedBy }) => <Input id={id} aria-describedby={describedBy} disabled defaultValue="SN-88213-B" />}
          </Field>
          <Field label="Descrição do problema" className="md:col-span-2">
            {({ id }) => <Textarea id={id} placeholder="O que está acontecendo com a máquina?" />}
          </Field>
        </div>
      </Section>

      <Section id="badges" title="Status, prioridade e SLA">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(WORK_ORDER_STATUS) as WorkOrderStatus[]).map((s) => <StatusBadge key={s} status={s} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(PRIORITY) as Priority[]).map((p) => <PriorityBadge key={p} priority={p} />)}
          <span className="mx-2 w-px bg-border" />
          {(Object.keys(CRITICALITY) as Criticality[]).map((c) => <CriticalityBadge key={c} criticality={c} />)}
        </div>
        <div className="flex flex-wrap gap-2">
          <SlaBadge state="ok" remaining="3 h" />
          <SlaBadge state="risk" remaining="25 min" />
          <SlaBadge state="breached" remaining="há 1 h" />
          <KindBadge kind="preventive" />
          <KindBadge kind="corrective" />
          <Badge>Neutro</Badge>
        </div>
      </Section>

      <Section id="kpis" title="Indicadores">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="OS abertas" value="18" />
          <KpiCard label="MTTR" value="3,2 h" delta={{ value: "−12%", up: false, good: true }} />
          <KpiCard label="MTBF Injetora 03" value="164 h" delta={{ value: "−8%", up: false, good: false }} />
          <KpiCard label="SLA cumprido" value="—" loading />
        </div>
      </Section>

      <Section id="tabela" title="Tabela de OS e estado vazio">
        <Table caption="Ordens de serviço">
          <thead>
            <tr><Th>Nº</Th><Th>Equipamento</Th><Th>Título</Th><Th>Status</Th><Th>Prioridade</Th><Th>SLA</Th></tr>
          </thead>
          <tbody>
            {demoOrders.map((o) => (
              <Tr key={o.n}>
                <Td className="font-mono tabular-nums">#{o.n}</Td>
                <Td>{o.asset}</Td>
                <Td>{o.title}</Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td><PriorityBadge priority={o.priority} /></Td>
                <Td>{o.sla ? <SlaBadge state={o.sla} /> : <span className="text-muted">—</span>}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma OS com esses filtros"
            description="Tente outro período ou limpe os filtros."
            action={<Button variant="secondary" size="sm">Limpar filtros</Button>}
          />
        </Card>
      </Section>

      <Section id="abas-modal" title="Abas, modal e aviso">
        <Card>
          <CardHeader title="Injetora 03" action={<CriticalityBadge criticality="critical" />} />
          <Tabs defaultValue="dados" className="px-4 pt-2 pb-4">
            <TabsList>
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="planos">Planos</TabsTrigger>
              <TabsTrigger value="historico">Histórico de OS</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="pt-4 text-sm">Fabricante, modelo, série, setor, responsável.</TabsContent>
            <TabsContent value="planos" className="pt-4 text-sm">Preventiva mensal · próxima em 31/10.</TabsContent>
            <TabsContent value="historico" className="pt-4 text-sm">12 OS nos últimos 6 meses.</TabsContent>
            <TabsContent value="docs" className="pt-4 text-sm">Manual do fabricante (PDF).</TabsContent>
          </Tabs>
        </Card>
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Cancelar OS…</Button></DialogTrigger>
            <DialogContent title="Cancelar a OS #1042?" description="O motivo fica no histórico da OS.">
              <div className="flex flex-col gap-4">
                <Field label="Motivo" required>{({ id }) => <Textarea id={id} />}</Field>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild><Button variant="ghost">Voltar</Button></DialogClose>
                  <Button variant="danger">Cancelar OS</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" onClick={() => toast.success("OS #1042 concluída")}>Aviso de sucesso</Button>
          <Button variant="secondary" onClick={() => toast.error("Sem internet. A OS será enviada quando a conexão voltar.")}>
            Aviso de erro
          </Button>
        </div>
      </Section>

      <Section id="navegacao" title="Navegação">
        <div className="flex flex-wrap items-start gap-6">
          <div className="h-[30rem] overflow-hidden rounded-lg border border-border">
            <Sidebar current="/os" />
          </div>
          <div className="w-[22rem] max-w-full overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between bg-surface-raised px-4 py-3">
              <p className="text-lg">Minhas OS</p>
              <SyncIndicator state={{ kind: "offline", pending: 3 }} />
            </div>
            <div className="h-24 bg-surface" />
            <BottomNav current="/app" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SyncIndicator state={{ kind: "online" }} />
          <SyncIndicator state={{ kind: "offline", pending: 0 }} />
          <SyncIndicator state={{ kind: "syncing", pending: 2 }} />
          <SyncIndicator state={{ kind: "error", pending: 1 }} />
        </div>
      </Section>

      <Section id="app" title="App do técnico: checklist e assinatura">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3">
          {demoItems.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              value={answers[item.id] ?? null}
              onChange={(v) => setAnswers((a) => ({ ...a, [item.id]: v }))}
              photoCount={photos[item.id]}
              onPhoto={item.kind === "photo" ? () => setPhotos((p) => ({ ...p, [item.id]: (p[item.id] ?? 0) + 1 })) : undefined}
              missing={showMissing && (item.required || item.critical) && answers[item.id] == null && !photos[item.id]}
            />
          ))}
          <Card className="p-4">
            <SignatureField label="Assinatura do técnico" onChange={onSignature} />
          </Card>
          <Button size="lg" block onClick={() => setShowMissing(true)}>Concluir OS</Button>
        </div>
      </Section>
    </div>
  );
}
