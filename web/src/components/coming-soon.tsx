import { Hammer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/page-header";

// Tela ainda não construída: diz em qual entrega ela chega
export function ComingSoon({ title, delivery, what }: { title: string; delivery: string; what: string }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState icon={Hammer} title={`Chega na ${delivery}`} description={what} />
      </Card>
    </>
  );
}
