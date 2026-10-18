import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Me } from "@/lib/auth";

// Para onde o QR da etiqueta leva cada pessoa: operador abre chamado, técnico e gestor veem a ficha
export async function qrDestination(token: string, me: Me) {
  const supabase = await createClient();
  const { data: asset } = await supabase.from("assets").select("id").eq("qr_token", token).maybeSingle();
  if (!asset) return "/app/qr?erro=nao-encontrado";
  return me.role === "requester" ? `/app/chamado?ativo=${asset.id}&origem=qr` : `/app/ativo/${asset.id}`;
}
