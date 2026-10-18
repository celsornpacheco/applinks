"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {(state.error || notice) && (
        <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">
          {state.error ?? notice}
        </p>
      )}
      <Field label="E-mail">
        {({ id }) => (
          <Input id={id} name="email" type="email" autoComplete="username" inputMode="email" required defaultValue={state.email} />
        )}
      </Field>
      <Field label="Senha">
        {({ id }) => <Input id={id} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        Entrar
      </Button>
    </form>
  );
}
