"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, ClipboardList, Cog, FileBarChart, Gauge, LayoutDashboard, ListChecks,
  Package, QrCode, Wrench, Factory, Bell, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

export const desktopNav: NavItem[] = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/os", label: "Ordens de serviço", icon: ClipboardList },
  { href: "/calendario", label: "Calendário", icon: CalendarDays },
  { href: "/ativos", label: "Equipamentos", icon: Factory },
  { href: "/planos", label: "Planos preventivos", icon: Wrench },
  { href: "/checklists", label: "Checklists", icon: ListChecks },
  { href: "/materiais", label: "Materiais", icon: Package },
  { href: "/indicadores", label: "Indicadores", icon: Gauge },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/config", label: "Configurações", icon: Cog },
];

export const mobileNav: NavItem[] = [
  { href: "/app", label: "Minhas OS", icon: ClipboardList },
  { href: "/app/qr", label: "Ler QR", icon: QrCode },
  { href: "/app/chamado", label: "Chamado", icon: Wrench },
  { href: "/app/avisos", label: "Avisos", icon: Bell },
];

function isActive(path: string, href: string) {
  return href === "/" || href === "/app" ? path === href : path.startsWith(href);
}

// Desktop: barra lateral escura. Gestores usam aqui.
export function Sidebar({ current }: { current?: string }) {
  const path = usePathname();
  const at = current ?? path;
  return (
    <nav aria-label="Principal" className="flex h-full w-[var(--layout-sidebar)] flex-col bg-sidebar text-on-sidebar">
      <div className="flex h-[var(--layout-header)] items-center gap-2 px-4 text-lg">
        <Wrench className="size-5" aria-hidden />
        Manutenção
      </div>
      <ul className="flex flex-col gap-0.5 px-2">
        {desktopNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(at, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm",
                  active ? "bg-sidebar-active text-on-sidebar" : "text-on-sidebar-muted hover:bg-sidebar-active hover:text-on-sidebar",
                )}
              >
                <Icon className="size-4.5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Celular: abas embaixo, ao alcance do polegar. Técnicos e operadores usam aqui.
export function BottomNav({ current }: { current?: string }) {
  const path = usePathname();
  const at = current ?? path;
  return (
    <nav
      aria-label="Principal"
      className="flex h-[var(--layout-bottom-nav)] border-t border-border bg-surface-raised pb-[env(safe-area-inset-bottom)]"
    >
      {mobileNav.map(({ href, label, icon: Icon }) => {
        const active = isActive(at, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-1 flex-col items-center justify-center gap-0.5 text-xs", active ? "text-accent" : "text-muted")}
          >
            <Icon className="size-6" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
