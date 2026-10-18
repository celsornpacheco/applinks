"use client";

import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

// Radix cuida do foco preso, Esc para fechar e aria-modal
export function DialogContent({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-40 bg-fg/40" />
      <D.Content
        className={cn(
          "fixed z-50 flex max-h-[90dvh] flex-col bg-surface-raised shadow-pop",
          // celular: sobe de baixo, largura total; desktop: centralizado
          "inset-x-0 bottom-0 rounded-t-lg md:inset-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg",
          className,
        )}
        {...(!description && { "aria-describedby": undefined })}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <D.Title className="text-lg">{title}</D.Title>
            {description && <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>}
          </div>
          <D.Close className="-m-2 rounded-md p-2 text-muted hover:bg-neutral-bg" aria-label="Fechar">
            <X className="size-5" />
          </D.Close>
        </header>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
