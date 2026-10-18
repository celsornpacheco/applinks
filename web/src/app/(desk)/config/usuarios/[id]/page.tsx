import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { AccessForm } from "./access-form";

export const metadata: Metadata = { title: "Editar usuário" };

export default async function EditUserPage({ params }: PageProps<"/config/usuarios/[id]">) {
  await requireMe(["admin"]);
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: user }, { data: areas }, { data: mine }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, role").eq("id", id).maybeSingle(),
    supabase.from("areas").select("id, name").eq("active", true).order("name"),
    supabase.from("profile_areas").select("area_id").eq("profile_id", id),
  ]);
  if (!user) notFound();
  return (
    <>
      <PageHeader title={user.full_name} description={user.email} back={{ href: "/config/usuarios", label: "Usuários" }} />
      <AccessForm user={user} areas={areas ?? []} selected={(mine ?? []).map((m) => m.area_id)} />
    </>
  );
}
