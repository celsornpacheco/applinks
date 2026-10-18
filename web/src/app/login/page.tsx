import type { Metadata } from "next";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, erro } = await searchParams;
  const notice = erro === "sem-perfil" ? "Seu acesso ainda não foi liberado. Fale com o administrador da manutenção." : undefined;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-lg bg-sidebar p-3 text-on-sidebar">
            <Wrench className="size-7" aria-hidden />
          </div>
          <h1 className="text-2xl">Inovapet Manutenção</h1>
          <p className="text-sm text-muted">Entre com o e-mail cadastrado pela manutenção.</p>
        </div>
        <Card className="p-5">
          <LoginForm next={typeof next === "string" ? next : undefined} notice={notice} />
        </Card>
        <Link href="/privacidade" className="text-center text-xs font-normal text-muted hover:underline">Privacidade</Link>
      </div>
    </main>
  );
}
