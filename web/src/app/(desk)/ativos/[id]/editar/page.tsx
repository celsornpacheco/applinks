import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AssetForm } from "../../asset-form";

export const metadata: Metadata = { title: "Editar equipamento" };

export default async function EditAssetPage({ params }: PageProps<"/ativos/[id]/editar">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: asset }, { data: areas }, { data: systems }] = await Promise.all([
    supabase.from("assets").select("*").eq("id", id).maybeSingle(),
    supabase.from("areas").select("id, name").eq("active", true).order("name"),
    supabase.from("systems").select("id, name").order("name"),
  ]);
  if (!asset) notFound();
  return (
    <>
      <PageHeader title={`Editar ${asset.tag}`} back={{ href: `/ativos/${id}`, label: asset.name }} />
      <AssetForm
        areas={areas ?? []}
        systems={systems ?? []}
        initial={{
          id: asset.id,
          tag: asset.tag,
          name: asset.name,
          area_id: asset.area_id,
          system_id: asset.system_id ?? "",
          manufacturer: asset.manufacturer ?? "",
          model: asset.model ?? "",
          serial_number: asset.serial_number ?? "",
          year: asset.year?.toString() ?? "",
          criticality: asset.criticality,
        }}
      />
    </>
  );
}
