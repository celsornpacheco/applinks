"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ROLE } from "@/lib/domain";
import { saveUserAccess } from "@/lib/actions/users";
import type { ActionResult } from "@/lib/actions/errors";

type Props = {
  user: { id: string; full_name: string; role: string };
  areas: { id: string; name: string }[];
  selected: string[];
};

export function AccessForm({ user, areas, selected }: Props) {
  const [state, run, pending] = useActionState<ActionResult, FormData>(saveUserAccess, {});
  const [role, setRole] = useState(user.role);
  useEffect(() => {
    if (state.ok) toast.success("Usuário salvo");
  }, [state]);

  return (
    <form action={run} className="flex max-w-xl flex-col gap-6">
      <input type="hidden" name="id" value={user.id} />
      {state.error && <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{state.error}</p>}
      <Card className="flex flex-col gap-4 p-5">
        <Field label="Nome completo" required>{({ id }) => <Input id={id} name="full_name" defaultValue={user.full_name} maxLength={120} />}</Field>
        <Field label="Perfil" required>
          {({ id }) => (
            <Select id={id} name="role" value={role} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          )}
        </Field>
      </Card>

      {role === "technician" && (
        <Card className="p-5">
          <fieldset className="flex flex-col gap-3">
            <legend className="text-base font-semibold">Setores que atende</legend>
            <p className="text-sm font-normal text-muted">
              O técnico vê as OS destes setores e as que forem atribuídas a ele. Sem nenhum marcado, vê todos.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {areas.map((a) => (
                <label key={a.id} className="flex min-h-11 items-center gap-3 rounded-md border border-border-input px-3">
                  <input type="checkbox" name="area_id" value={a.id} defaultChecked={selected.includes(a.id)} className="size-5 accent-[var(--accent)]" />
                  <span className="text-sm">{a.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="submit" loading={pending}>Salvar</Button>
        <Link href="/config/usuarios" className={buttonVariants({ variant: "ghost" })}>Voltar</Link>
      </div>
    </form>
  );
}
