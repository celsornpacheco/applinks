import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Cliente com a sessão do usuário: tudo passa pelas regras de acesso (RLS) do banco.
export async function createClient() {
  const store = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component não pode gravar cookie; o proxy renova a sessão.
        }
      },
    },
  });
}

// Chave secreta: ignora as regras de acesso. Só para o que o usuário não pode fazer sozinho
// (criar contas de outras pessoas). Nunca importe em componente de cliente.
export function createServiceClient() {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY não configurada");
  return createAdminClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
