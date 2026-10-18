"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { PRIORITY, type Priority } from "@/lib/domain";
import type { ActionResult } from "@/lib/actions/errors";
import { addSlaOverride, removeSlaOverride, saveDefaultSla, saveGeneralSettings, setCategoryActive } from "@/lib/actions/settings";

type Rule = { id: string; priority: string; response_minutes: number; resolution_minutes: number; categories?: { name: string } | null };

const hours = (m: number) => String(Math.round((m / 60) * 100) / 100).replace(".", ",");

function useSavedToast(state: ActionResult, msg: string) {
  useEffect(() => {
    if (state.ok) toast.success(msg);
  }, [state, msg]);
}

function ErrorLine({ error }: { error?: string }) {
  return error ? <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{error}</p> : null;
}

export function DefaultSlaForm({ rules }: { rules: Rule[] }) {
  const [state, run, pending] = useActionState<ActionResult, FormData>(saveDefaultSla, {});
  useSavedToast(state, "Prazos salvos. Valem para os próximos chamados.");
  return (
    <form action={run} className="flex flex-col gap-4">
      <ErrorLine error={state.error} />
      <table className="w-full text-sm">
        <caption className="sr-only">Prazos por prioridade, em horas</caption>
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className="pb-2 font-semibold">Prioridade</th>
            <th scope="col" className="pb-2 font-semibold">Resposta (h)</th>
            <th scope="col" className="pb-2 font-semibold">Solução (h)</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(PRIORITY) as Priority[]).reverse().map((p) => {
            const r = rules.find((x) => x.priority === p);
            return (
              <tr key={p}>
                <th scope="row" className="py-1.5 pr-3 text-left font-medium">{PRIORITY[p]}</th>
                <td className="py-1.5 pr-3">
                  <Input name={`${p}_response`} inputMode="decimal" defaultValue={r ? hours(r.response_minutes) : ""} aria-label={`Resposta, prioridade ${PRIORITY[p]}`} className="w-28" />
                </td>
                <td className="py-1.5">
                  <Input name={`${p}_resolution`} inputMode="decimal" defaultValue={r ? hours(r.resolution_minutes) : ""} aria-label={`Solução, prioridade ${PRIORITY[p]}`} className="w-28" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs font-normal text-muted">Use vírgula para frações: 0,25 = 15 minutos.</p>
      <Button type="submit" className="w-fit" loading={pending}>Salvar prazos</Button>
    </form>
  );
}

export function OverrideRow({ rule }: { rule: Rule }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span>
        <strong className="font-semibold">{rule.categories?.name}</strong> · {PRIORITY[rule.priority as Priority]}:{" "}
        resposta {hours(rule.response_minutes)} h, solução {hours(rule.resolution_minutes)} h
      </span>
      <Button
        variant="ghost"
        size="icon"
        loading={pending}
        aria-label={`Remover exceção de ${rule.categories?.name}`}
        onClick={() => start(async () => {
          const res = await removeSlaOverride(rule.id);
          if (res.error) toast.error(res.error);
          router.refresh();
        })}
      >
        {!pending && <Trash2 />}
      </Button>
    </li>
  );
}

export function OverrideForm({ categories }: { categories: { id: string; name: string }[] }) {
  const [state, run, pending] = useActionState<ActionResult, FormData>(addSlaOverride, {});
  useSavedToast(state, "Exceção criada");
  return (
    <form action={run} className="flex flex-col gap-3">
      <ErrorLine error={state.error} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Categoria">
          {({ id }) => (
            <Select id={id} name="category_id" defaultValue="">
              <option value="" disabled>Escolha</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Prioridade">
          {({ id }) => (
            <Select id={id} name="priority" defaultValue="high">
              {Object.entries(PRIORITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Resposta (h)">{({ id }) => <Input id={id} name="response" inputMode="decimal" />}</Field>
        <Field label="Solução (h)">{({ id }) => <Input id={id} name="resolution" inputMode="decimal" />}</Field>
      </div>
      <Button type="submit" variant="secondary" className="w-fit" loading={pending}>Adicionar exceção</Button>
    </form>
  );
}

export function GeneralForm({ requireSignature, riskPercent }: { requireSignature: boolean; riskPercent: number }) {
  const [state, run, pending] = useActionState<ActionResult, FormData>(saveGeneralSettings, {});
  useSavedToast(state, "Regras salvas");
  return (
    <form action={run} className="flex flex-col gap-4">
      <ErrorLine error={state.error} />
      <label className="flex min-h-11 items-center gap-3">
        <input type="checkbox" name="require_signature" defaultChecked={requireSignature} className="size-5 accent-[var(--accent)]" />
        <span className="text-sm">Exigir a assinatura do técnico para concluir a OS</span>
      </label>
      <Field label="Avisar “SLA em risco” quando passar de (% do prazo)" hint="Entre 50 e 99. Padrão: 80.">
        {({ id, describedBy }) => (
          <Input id={id} name="sla_risk_percent" type="number" min={50} max={99} defaultValue={riskPercent} aria-describedby={describedBy} className="w-28" />
        )}
      </Field>
      <Button type="submit" variant="secondary" className="w-fit" loading={pending}>Salvar regras</Button>
    </form>
  );
}

export function CategoryRow({ category }: { category: { id: string; name: string; active: boolean } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
      <span className="flex items-center gap-2">
        {category.name}
        {!category.active && <Badge>Oculta</Badge>}
      </span>
      <Button
        variant="ghost"
        size="sm"
        loading={pending}
        aria-label={`${category.active ? "Ocultar" : "Mostrar"} ${category.name}`}
        onClick={() => start(async () => {
          const res = await setCategoryActive(category.id, !category.active);
          if (res.error) toast.error(res.error);
          router.refresh();
        })}
      >
        {category.active ? "Ocultar" : "Mostrar"}
      </Button>
    </li>
  );
}
