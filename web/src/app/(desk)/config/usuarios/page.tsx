import type { Metadata } from "next";
import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { ROLE, type Role } from "@/lib/domain";
import { NewUserForm, ToggleActive } from "./user-forms";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const me = await requireMe(["admin"]);
  const supabase = await createClient();
  const { data: users } = await supabase.from("profiles").select("id, full_name, email, role, active").order("full_name");

  return (
    <>
      <PageHeader title="Usuários" back={{ href: "/config", label: "Configurações" }} description={`${users?.length ?? 0} conta(s)`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Table caption="Usuários">
          <thead>
            <tr><Th>Nome</Th><Th>E-mail</Th><Th>Perfil</Th><Th>Situação</Th><Th><span className="sr-only">Ações</span></Th></tr>
          </thead>
          <tbody>
            {(users ?? []).map((u) => (
              <Tr key={u.id}>
                <Td><Link href={`/config/usuarios/${u.id}`} className="font-semibold text-accent hover:underline">{u.full_name}</Link></Td>
                <Td className="text-muted">{u.email}</Td>
                <Td>{ROLE[u.role as Role]}</Td>
                <Td>{u.active ? <Badge tone="done">Ativo</Badge> : <Badge>Desativado</Badge>}</Td>
                <Td className="text-right">{u.id !== me.id && <ToggleActive id={u.id} active={u.active} name={u.full_name} />}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        <Card>
          <CardHeader title="Nova conta" />
          <div className="p-4"><NewUserForm /></div>
        </Card>
      </div>
    </>
  );
}
