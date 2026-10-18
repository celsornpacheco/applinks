import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Planos preventivos" };

export default function Page() {
  return <ComingSoon title="Planos preventivos" delivery="entrega 2" what="Planos com periodicidade que geram as OS sozinhos." />;
}
