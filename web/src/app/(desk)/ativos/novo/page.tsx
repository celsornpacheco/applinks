import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AssetForm } from "../asset-form";

export const metadata: Metadata = { title: "Novo equipamento" };

export default async function NewAssetPage() {
  const supabase = await createClient();
  const [{ data: areas }, { data: systems }] = await Promise.all([
    supabase.from("areas").select("id, name").eq("active", true).order("name"),
    supabase.from("systems").select("id, name").order("name"),
  ]);
  return (
    <>
      <PageHeader title="Novo equipamento" back={{ href: "/ativos", label: "Equipamentos" }} />
      <AssetForm areas={areas ?? []} systems={systems ?? []} />
    </>
  );
}
