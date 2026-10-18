import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Materiais" };

export default function Page() {
  return <ComingSoon title="Materiais" delivery="entrega 4" what="Pedidos de peça ao almoxarifado feitos a partir da OS." />;
}
