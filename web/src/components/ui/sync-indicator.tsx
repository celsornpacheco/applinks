import { CloudOff, CloudUpload, Cloud, TriangleAlert } from "lucide-react";
import { Badge } from "./badge";

export type SyncState =
  | { kind: "online" }
  | { kind: "offline"; pending: number }
  | { kind: "syncing"; pending: number }
  | { kind: "error"; pending: number };

// Mostra no topo do app do técnico se o que ele fez já foi para o servidor
export function SyncIndicator({ state }: { state: SyncState }) {
  switch (state.kind) {
    case "online":
      return <Badge tone="done"><Cloud aria-hidden />Sincronizado</Badge>;
    case "offline":
      return (
        <Badge tone="neutral">
          <CloudOff aria-hidden />Sem internet{state.pending > 0 && ` · ${state.pending} para enviar`}
        </Badge>
      );
    case "syncing":
      return <Badge tone="info"><CloudUpload aria-hidden />Enviando {state.pending}…</Badge>;
    case "error":
      return <Badge tone="urgent"><TriangleAlert aria-hidden />Falha ao enviar {state.pending}</Badge>;
  }
}
