import type { SlaState } from "@/lib/domain";

const TZ = "America/Sao_Paulo";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short" });

export const fmtDateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");
// datas puras (yyyy-mm-dd) não passam por fuso
export const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  return dateFmt.format(new Date(d));
};

export const daysAgoIso = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

export function fmtDuration(ms: number) {
  const abs = Math.abs(ms);
  const min = Math.round(abs / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} h${min % 60 ? ` ${min % 60} min` : ""}`;
  return `${Math.round(h / 24)} dias`;
}

// Mesma regra do check_sla() no banco: em risco a partir de 80% do prazo
export function slaState(
  wo: { opened_at: string; resolution_due_at: string | null; status: string },
  riskPercent = 80,
  now = Date.now(),
): { state: SlaState; label: string } | null {
  if (!wo.resolution_due_at || wo.status === "done" || wo.status === "cancelled") return null;
  const start = new Date(wo.opened_at).getTime();
  const due = new Date(wo.resolution_due_at).getTime();
  if (now > due) return { state: "breached", label: `há ${fmtDuration(now - due)}` };
  const risk = start + ((due - start) * riskPercent) / 100;
  return { state: now >= risk ? "risk" : "ok", label: `faltam ${fmtDuration(due - now)}` };
}
