import type { Metadata } from "next";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TicketForm } from "@/components/ticket-form";

export const metadata: Metadata = { title: "Nova OS corretiva" };

export default async function NewWorkOrderPage({ searchParams }: PageProps<"/os/nova">) {
  const me = await requireMe(["admin", "manager"]);
  const { ativo } = await searchParams;
  const supabase = await createClient();
  const [{ data: assets }, { data: categories }] = await Promise.all([
    supabase.from("assets").select("id, tag, name, areas(name)").eq("status", "active").order("tag"),
    supabase.from("categories").select("id, name").eq("active", true).order("name"),
  ]);
  return (
    <>
      <PageHeader title="Nova OS corretiva" back={{ href: "/os", label: "Ordens de serviço" }} />
      <div className="max-w-xl">
        <TicketForm
          me={{ id: me.id }}
          assets={(assets ?? []).map((a) => ({ id: a.id, label: `${a.tag} · ${a.name}`, area: a.areas?.name ?? "" }))}
          categories={categories ?? []}
          presetAssetId={typeof ativo === "string" ? ativo : undefined}
          origin="web"
          detailBase="/os"
        />
      </div>
    </>
  );
}
