import Link from "next/link";
import { Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

// Provisório até o /replica-build: o painel entra aqui.
export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <Wrench className="size-8 text-accent" aria-hidden />
      <h1 className="text-2xl">Inovapet Manutenção</h1>
      <p className="text-muted">Em construção.</p>
      <Link href="/design" className={buttonVariants({ variant: "secondary" })}>Ver o sistema de design</Link>
    </main>
  );
}
