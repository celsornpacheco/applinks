import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDateTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import { markAllRead } from "@/lib/actions/notifications";

export const metadata: Metadata = { title: "Avisos" };

export default async function NotificationsPage() {
  const me = await requireMe();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, kind, work_order_id, read_at, created_at")
    .eq("profile_id", me.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const unread = (data ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Avisos</h1>
        {unread > 0 && (
          <form action={markAllRead}>
            <button className="text-sm font-semibold text-accent">Marcar todos como lidos</button>
          </form>
        )}
      </div>
      {!data?.length ? (
        <Card><EmptyState icon={Bell} title="Nenhum aviso" description="Avisos de OS atribuídas, chamados concluídos e prazos aparecem aqui." /></Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((n) => (
            <li key={n.id}>
              <Link
                href={n.work_order_id ? `/app/os/${n.work_order_id}` : "/app/avisos"}
                className={cn("flex flex-col gap-0.5 rounded-lg border bg-surface-raised p-4", n.read_at ? "border-border" : "border-accent")}
              >
                <span className="text-base">{!n.read_at && <span className="sr-only">Não lido: </span>}{n.title}</span>
                <span className="text-xs font-normal text-muted">{fmtDateTime(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
