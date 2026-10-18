import Link from "next/link";
import { KindBadge, PriorityBadge, SlaBadge, StatusBadge } from "@/components/ui/badge";
import { Table, Td, Th, Tr } from "@/components/ui/table";
import { fmtDate, fmtDateTime, slaState } from "@/lib/format";
import type { Priority, WorkOrderKind, WorkOrderStatus } from "@/lib/domain";

export type WorkOrderRow = {
  id: string;
  number: number;
  kind: string;
  title: string;
  status: string;
  priority: string;
  opened_at: string;
  scheduled_for: string | null;
  resolution_due_at: string | null;
  assets?: { tag: string; name: string } | null;
};

export function WorkOrderTable({ rows, showAsset = true, caption }: { rows: WorkOrderRow[]; showAsset?: boolean; caption: string }) {
  return (
    <Table caption={caption}>
      <thead>
        <tr>
          <Th>Nº</Th>
          {showAsset && <Th>Equipamento</Th>}
          <Th>Título</Th>
          <Th>Tipo</Th>
          <Th>Status</Th>
          <Th>Prioridade</Th>
          <Th>Prazo</Th>
          <Th>Aberta / prevista</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((o) => {
          const sla = slaState(o);
          return (
            <Tr key={o.id}>
              <Td className="font-mono whitespace-nowrap tabular-nums">
                <Link href={`/os/${o.id}`} className="font-semibold text-accent hover:underline">#{o.number}</Link>
              </Td>
              {showAsset && (
                <Td className="whitespace-nowrap">
                  {o.assets ? <><span className="font-mono">{o.assets.tag}</span> · {o.assets.name}</> : "—"}
                </Td>
              )}
              <Td><p className="max-w-72 truncate">{o.title}</p></Td>
              <Td><KindBadge kind={o.kind as WorkOrderKind} /></Td>
              <Td><StatusBadge status={o.status as WorkOrderStatus} /></Td>
              <Td><PriorityBadge priority={o.priority as Priority} /></Td>
              <Td>{sla ? <SlaBadge state={sla.state} remaining={sla.label} /> : <span className="text-muted">—</span>}</Td>
              <Td className="whitespace-nowrap text-muted">
                {o.kind === "preventive" ? fmtDate(o.scheduled_for) : fmtDateTime(o.opened_at)}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
