"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { ActionResult } from "@/lib/actions/errors";

type Props = {
  action: (s: ActionResult, f: FormData) => Promise<ActionResult>;
  label: string;
  placeholder?: string;
  hidden?: Record<string, string>;
};

// Cadastro de um nome só (setor, sistema): limpa o campo depois de salvar
export function NameForm({ action, label, placeholder, hidden = {} }: Props) {
  const [state, run, pending] = useActionState(action, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={run} className="flex items-end gap-2">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <Field label={label} error={state.error} className="flex-1">
        {({ id, describedBy, invalid }) => (
          <Input id={id} name="name" placeholder={placeholder} maxLength={80} aria-describedby={describedBy} aria-invalid={invalid} />
        )}
      </Field>
      <Button type="submit" variant="secondary" className="h-11" loading={pending}>
        <Plus aria-hidden />Adicionar
      </Button>
    </form>
  );
}
