import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-lg border border-border bg-surface-raised shadow-card", className)} {...props} />;
}

export function CardHeader({ title, action, className }: { title: string; action?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("flex items-center justify-between gap-3 border-b border-border px-4 py-3", className)}>
      <h2 className="text-lg">{title}</h2>
      {action}
    </header>
  );
}

type KpiProps = {
  label: string;
  value: string;
  // variação em relação ao período anterior; "good" diz se subir é bom (MTBF) ou ruim (MTTR)
  delta?: { value: string; up: boolean; good: boolean };
  loading?: boolean;
};

export function KpiCard({ label, value, delta, loading }: KpiProps) {
  return (
    <Card className="flex flex-col gap-1 p-4" aria-busy={loading || undefined}>
      <p className="text-sm text-muted">{label}</p>
      {loading ? (
        <div className="h-9 w-24 animate-pulse rounded-sm bg-neutral-bg" />
      ) : (
        <p className="text-2xl tabular-nums">{value}</p>
      )}
      {delta && !loading && (
        <p className={cn("flex items-center gap-1 text-xs", delta.good ? "text-success" : "text-danger")}>
          {delta.up ? <TrendingUp className="size-3.5" aria-hidden /> : <TrendingDown className="size-3.5" aria-hidden />}
          {delta.value} vs. período anterior
        </p>
      )}
    </Card>
  );
}
