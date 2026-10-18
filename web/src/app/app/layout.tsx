import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { isManagerRole, requireMe } from "@/lib/auth";
import { BottomNav } from "@/components/app-shell";
import { signOut } from "@/app/login/actions";
import { InstallBanner } from "@/components/pwa";

// App do celular: técnicos e operadores. O gestor também pode usar (atalho para o painel).
export default async function MobileLayout({ children }: LayoutProps<"/app">) {
  const me = await requireMe();
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-surface-raised px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 min-w-0 flex-col justify-center">
          <p className="text-xs font-normal text-muted">Manutenção</p>
          <p className="truncate text-base font-semibold">{me.fullName}</p>
        </div>
        <div className="flex items-center gap-1">
          {isManagerRole(me.role) && (
            <Link href="/" className="rounded-md p-2.5 text-muted hover:bg-neutral-bg" aria-label="Ir para o painel">
              <LayoutDashboard className="size-5" />
            </Link>
          )}
          <form action={signOut}>
            <button className="rounded-md p-2.5 text-muted hover:bg-neutral-bg" aria-label="Sair">
              <LogOut className="size-5" />
            </button>
          </form>
        </div>
      </header>
      <main id="conteudo" className="flex-1 px-4 pt-4 pb-[calc(var(--layout-bottom-nav)+env(safe-area-inset-bottom)+1rem)]">
        <div className="mx-auto max-w-lg">
          <InstallBanner />
          {children}
        </div>
      </main>
      <div className="fixed inset-x-0 bottom-0 z-30">
        <BottomNav />
      </div>
    </div>
  );
}
