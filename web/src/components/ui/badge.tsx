import { cva, type VariantProps } from "class-variance-authority";
import { AlarmClock, CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CRITICALITY, PRIORITY, SLA_STATE, WORK_ORDER_KIND, WORK_ORDER_STATUS,
  type Criticality, type Priority, type SlaState, type WorkOrderKind, type WorkOrderStatus,
} from "@/lib/domain";

const badge = cva("inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-xs whitespace-nowrap [&_svg]:size-3.5", {
  variants: {
    tone: {
      info: "bg-info-bg text-info-fg",
      progress: "bg-progress-bg text-progress-fg",
      waiting: "bg-waiting-bg text-waiting-fg",
      done: "bg-done-bg text-done-fg",
      neutral: "bg-neutral-bg text-neutral-fg",
      high: "bg-high-bg text-high-fg",
      urgent: "bg-urgent-bg text-urgent-fg",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

type Tone = NonNullable<VariantProps<typeof badge>["tone"]>;

const statusTone: Record<WorkOrderStatus, Tone> = {
  open: "info",
  assigned: "info",
  in_progress: "progress",
  waiting_material: "waiting",
  done: "done",
  cancelled: "neutral",
};
export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return <Badge tone={statusTone[status]}>{WORK_ORDER_STATUS[status]}</Badge>;
}

const priorityTone: Record<Priority, Tone> = { low: "neutral", medium: "info", high: "high", urgent: "urgent" };
export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={priorityTone[priority]}>{PRIORITY[priority]}</Badge>;
}

const criticalityTone: Record<Criticality, Tone> = { low: "neutral", medium: "info", high: "high", critical: "urgent" };
export function CriticalityBadge({ criticality }: { criticality: Criticality }) {
  return <Badge tone={criticalityTone[criticality]}>{CRITICALITY[criticality]}</Badge>;
}

export function KindBadge({ kind }: { kind: WorkOrderKind }) {
  return <Badge tone={kind === "preventive" ? "done" : "high"}>{WORK_ORDER_KIND[kind]}</Badge>;
}

// Cor nunca sozinha: sempre ícone + texto
const slaIcon = { ok: CircleCheck, risk: AlarmClock, breached: CircleAlert };
const slaTone: Record<SlaState, Tone> = { ok: "done", risk: "progress", breached: "urgent" };
export function SlaBadge({ state, remaining }: { state: SlaState; remaining?: string }) {
  const Icon = slaIcon[state];
  return (
    <Badge tone={slaTone[state]}>
      <Icon aria-hidden />
      {SLA_STATE[state]}
      {remaining && <span className="font-normal">· {remaining}</span>}
    </Badge>
  );
}
