"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { ROLE } from "@/lib/domain";
import { createUser, setUserActive } from "@/lib/actions/users";
import type { ActionResult } from "@/lib/actions/errors";

const ROLE_HINT: Record<string, string> = {
  admin: "Tudo, inclusive contas e configurações.",
  manager: "Cadastros, planos, OS e relatórios.",
  technician: "Executa as OS no celular.",
  requester: "Abre chamados e acompanha os seus.",
};

export function NewUserForm() {
  const [state, run, pending] = useActionState<ActionResult, FormData>(createUser, {});
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success("Conta criada. Passe o e-mail e a senha inicial para a pessoa.");
      form.current?.reset();
    }
  }, [state]);
  return (
    <form ref={form} action={run} className="flex flex-col gap-4" noValidate>
      {state.error && <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">{state.error}</p>}
      <Field label="Nome completo" required>{({ id }) => <Input id={id} name="full_name" maxLength={120} />}</Field>
      <Field label="E-mail" required hint="É o login. Pode ser um e-mail da empresa ou pessoal.">
        {({ id, describedBy }) => <Input id={id} name="email" type="email" aria-describedby={describedBy} />}
      </Field>
      <Field label="Perfil" required>
        {({ id }) => (
          <Select id={id} name="role" defaultValue="technician">
            {Object.entries(ROLE).map(([k, l]) => <option key={k} value={k}>{l} · {ROLE_HINT[k]}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Senha inicial" required hint="Mínimo de 8 caracteres.">
        {({ id, describedBy }) => <Input id={id} name="password" type="text" autoComplete="new-password" aria-describedby={describedBy} />}
      </Field>
      <Button type="submit" loading={pending}>Criar conta</Button>
    </form>
  );
}

export function ToggleActive({ id, active, name }: { id: string; active: boolean; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      aria-label={`${active ? "Desativar" : "Reativar"} ${name}`}
      onClick={() =>
        start(async () => {
          const res = await setUserActive(id, !active);
          if (res.error) toast.error(res.error);
          router.refresh();
        })
      }
    >
      {active ? "Desativar" : "Reativar"}
    </Button>
  );
}
