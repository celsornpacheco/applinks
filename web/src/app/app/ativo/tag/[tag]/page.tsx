import { redirect } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// Tag digitada à mão no leitor: mesmo destino do QR
export default async function AssetByTagPage({ params }: PageProps<"/app/ativo/tag/[tag]">) {
  const me = await requireMe();
  const { tag } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("assets").select("id").eq("tag", decodeURIComponent(tag).toUpperCase()).maybeSingle();
  if (!data) redirect("/app/qr?erro=nao-encontrado");
  redirect(me.role === "requester" ? `/app/chamado?ativo=${data.id}` : `/app/ativo/${data.id}`);
}
