import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Calendário" };

export default function Page() {
  return <ComingSoon title="Calendário" delivery="entrega 2" what="Calendário mensal e semanal das preventivas, por equipe e técnico." />;
}
