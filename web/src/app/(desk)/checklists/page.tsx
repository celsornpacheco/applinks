import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Checklists" };

export default function Page() {
  return <ComingSoon title="Checklists" delivery="entrega 2" what="Modelos de checklist com leituras, fotos e itens obrigatórios." />;
}
