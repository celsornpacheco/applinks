import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MapPin, Timer, Users } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfigPage() {
  const me = await requireMe(["admin", "manager"]);
  const items = [
    { href: "/config/locais", icon: MapPin, title: "Setores e sistemas", text: "Onde ficam as máquinas e de que tipo são." },
    { href: "/config/chamados", icon: Timer, title: "Chamados e prazos", text: "Categorias, prazos de SLA e regras de conclusão." },
    ...(me.role === "admin" ? [{ href: "/config/usuarios", icon: Users, title: "Usuários", text: "Contas de gestores, técnicos e operadores." }] : []),
  ];
  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center gap-4 p-4 hover:bg-surface">
              <Icon className="size-6 text-accent" aria-hidden />
              <div className="flex-1">
                <p className="text-base font-semibold">{title}</p>
                <p className="text-sm font-normal text-muted">{text}</p>
              </div>
              <ChevronRight className="size-5 text-muted" aria-hidden />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
