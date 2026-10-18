import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Indicadores" };

export default function Page() {
  return <ComingSoon title="Indicadores" delivery="entrega 3" what="MTTR, MTBF, cumprimento de SLA e aderência ao plano, por máquina e setor." />;
}
