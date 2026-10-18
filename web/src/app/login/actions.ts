"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMe, homeFor } from "@/lib/auth";
import { qrDestination } from "@/lib/qr-destination";

export type LoginState = { error?: string; email?: string };

// só caminhos internos, para o ?next= não virar redirecionamento para fora
const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : null;
};

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou senha incorretos.", email };

  const me = await getMe();
  if (!me) {
    await supabase.auth.signOut();
    return { error: "Seu acesso ainda não foi liberado. Fale com o administrador da manutenção.", email };
  }
  const next = safeNext(form.get("next"));
  // veio de um QR: resolve aqui (o roteador do navegador não segue redirecionamento de rota de API)
  const qr = next?.match(/^\/q\/([A-Za-z0-9_-]+)$/);
  redirect(qr ? await qrDestination(qr[1], me) : (next ?? homeFor(me.role)));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
