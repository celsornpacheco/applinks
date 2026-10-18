import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Relatórios" };

export default function Page() {
  return <ComingSoon title="Relatórios" delivery="entrega 3" what="Relatórios em PDF e Excel com fotos e assinaturas." />;
}
