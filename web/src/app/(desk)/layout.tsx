import { LogOut } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { ROLE } from "@/lib/domain";
import { Sidebar, TopNav } from "@/components/app-shell";
import { signOut } from "@/app/login/actions";

// Área do gestor (desktop). Técnico e solicitante vão para o app (/app).
export default async function DeskLayout({ children }: LayoutProps<"/">) {
  const me = await requireMe(["admin", "manager"]);
  return (
    <div className="flex min-h-dvh">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-bg focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
        <Sidebar
          footer={
            <div className="flex items-center justify-between gap-2 border-t border-sidebar-active px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">{me.fullName}</p>
                <p className="text-xs font-normal text-on-sidebar-muted">{ROLE[me.role]}</p>
              </div>
              <form action={signOut}>
                <button className="rounded-md p-2 text-on-sidebar-muted hover:bg-sidebar-active hover:text-on-sidebar" aria-label="Sair">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          }
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 lg:hidden">
          <TopNav />
        </div>
        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-[var(--layout-content-max)]">{children}</div>
        </main>
      </div>
    </div>
  );
}
