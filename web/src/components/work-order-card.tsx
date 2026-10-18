import Link from "next/link";
import { ChevronRight, OctagonAlert } from "lucide-react";
import { KindBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { fmtDate, fmtDateTime, slaState } from "@/lib/format";
import type { Priority, WorkOrderKind, WorkOrderStatus } from "@/lib/domain";
import type { WorkOrderRow } from "./work-order-table";

// Uma OS no celular: cartão inteiro clicável, alvo grande
export function WorkOrderCard({ wo, href }: { wo: WorkOrderRow & { machine_stopped?: boolean }; href: string }) {
  const sla = slaState(wo);
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised p-4 shadow-card active:bg-surface"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-mono">#{wo.number}</span>
          {wo.assets && <span className="truncate font-mono">{wo.assets.tag}</span>}
          {wo.machine_stopped && (
            <span className="flex items-center gap-1 text-urgent-fg"><OctagonAlert className="size-3.5" aria-hidden />Máquina parada</span>
          )}
        </div>
        <p className="line-clamp-2 text-base font-semibold">{wo.title}</p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={wo.status as WorkOrderStatus} />
          <KindBadge kind={wo.kind as WorkOrderKind} />
          <PriorityBadge priority={wo.priority as Priority} />
          {sla && <SlaBadge state={sla.state} remaining={sla.label} />}
        </div>
        <p className="text-xs font-normal text-muted">
          {wo.kind === "preventive" ? `Prevista para ${fmtDate(wo.scheduled_for)}` : `Aberta em ${fmtDateTime(wo.opened_at)}`}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );
}
