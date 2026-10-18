"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { CRITICALITY } from "@/lib/domain";
import { saveAsset, type AssetFormState } from "@/lib/actions/assets";

type Option = { id: string; name: string };
export type AssetValues = Partial<Record<
  "id" | "tag" | "name" | "area_id" | "system_id" | "manufacturer" | "model" | "serial_number" | "year" | "criticality",
  string
>>;

export function AssetForm({ areas, systems, initial = {} }: { areas: Option[]; systems: Option[]; initial?: AssetValues }) {
  const [state, action, pending] = useActionState<AssetFormState, FormData>(saveAsset, {});
  const v = { ...initial, ...state.fields };

  return (
    <form action={action} className="flex max-w-3xl flex-col gap-6" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && (
        <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{state.error}</p>
      )}
      {!areas.length && (
        <p className="rounded-md bg-progress-bg px-3 py-2 text-sm text-progress-fg">
          Cadastre pelo menos um setor antes, em <Link className="underline" href="/config/locais">Configurações → Setores e sistemas</Link>.
        </p>
      )}
      <Card className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="Tag" required hint="Código curto e único, vai na etiqueta. Ex.: INJ-03">
          {({ id, describedBy }) => (
            <Input id={id} name="tag" defaultValue={v.tag} aria-describedby={describedBy} className="font-mono uppercase" maxLength={30} autoFocus={!initial.id} />
          )}
        </Field>
        <Field label="Nome" required>
          {({ id }) => <Input id={id} name="name" defaultValue={v.name} placeholder="Ex.: Injetora 03" maxLength={120} />}
        </Field>
        <Field label="Setor" required>
          {({ id }) => (
            <Select id={id} name="area_id" defaultValue={v.area_id ?? ""}>
              <option value="" disabled>Escolha o setor</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Sistema">
          {({ id }) => (
            <Select id={id} name="system_id" defaultValue={v.system_id ?? ""}>
              <option value="">Nenhum</option>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Criticidade" hint="Quanto a parada desta máquina afeta a produção.">
          {({ id, describedBy }) => (
            <Select id={id} name="criticality" defaultValue={v.criticality ?? "medium"} aria-describedby={describedBy}>
              {Object.entries(CRITICALITY).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          )}
        </Field>
        <Field label="Ano de fabricação">
          {({ id }) => <Input id={id} name="year" defaultValue={v.year} inputMode="numeric" maxLength={4} />}
        </Field>
        <Field label="Fabricante">
          {({ id }) => <Input id={id} name="manufacturer" defaultValue={v.manufacturer} maxLength={80} />}
        </Field>
        <Field label="Modelo">
          {({ id }) => <Input id={id} name="model" defaultValue={v.model} maxLength={80} />}
        </Field>
        <Field label="Número de série" className="md:col-span-2">
          {({ id }) => <Input id={id} name="serial_number" defaultValue={v.serial_number} maxLength={80} />}
        </Field>
      </Card>
      <div className="flex gap-2">
        <Button type="submit" loading={pending}>{initial.id ? "Salvar alterações" : "Cadastrar equipamento"}</Button>
        <Link href={initial.id ? `/ativos/${initial.id}` : "/ativos"} className={buttonVariants({ variant: "ghost" })}>Cancelar</Link>
      </div>
    </form>
  );
}
