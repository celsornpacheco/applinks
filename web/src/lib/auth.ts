import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/domain";

export type Me = { id: string; email: string; fullName: string; role: Role };

// Usuário logado + perfil. Uma consulta por requisição (cache do React).
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, active")
    .eq("id", id)
    .maybeSingle();
  if (!profile || !profile.active) return null;
  return { id: profile.id, email: profile.email, fullName: profile.full_name, role: profile.role as Role };
});

export async function requireMe(allowed?: Role[]): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/login?erro=sem-perfil");
  if (allowed && !allowed.includes(me.role)) redirect(homeFor(me.role));
  return me;
}

export const isManagerRole = (r: Role) => r === "admin" || r === "manager";

// Gestor trabalha no desktop; técnico e solicitante no app do celular.
export function homeFor(role: Role) {
  return isManagerRole(role) ? "/" : "/app";
}
