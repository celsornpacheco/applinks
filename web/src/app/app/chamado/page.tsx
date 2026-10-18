import type { Metadata } from "next";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TicketForm } from "@/components/ticket-form";

export const metadata: Metadata = { title: "Abrir chamado" };

export default async function NewTicketPage({ searchParams }: PageProps<"/app/chamado">) {
  const me = await requireMe();
  const { ativo, origem } = await searchParams;
  const supabase = await createClient();
  const [{ data: assets }, { data: categories }] = await Promise.all([
    supabase.from("assets").select("id, tag, name, areas(name)").eq("status", "active").order("tag"),
    supabase.from("categories").select("id, name").eq("active", true).order("name"),
  ]);
  const preset = typeof ativo === "string" ? assets?.find((a) => a.id === ativo) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl">Abrir chamado</h1>
      <TicketForm
        me={{ id: me.id }}
        assets={(assets ?? []).map((a) => ({ id: a.id, label: `${a.tag} · ${a.name}`, area: a.areas?.name ?? "" }))}
        categories={categories ?? []}
        presetAssetId={preset?.id}
        origin={origem === "qr" ? "qr" : "app"}
      />
    </div>
  );
}
