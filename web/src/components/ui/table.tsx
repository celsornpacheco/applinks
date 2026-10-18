import { cn } from "@/lib/cn";

// Tabela simples com rolagem horizontal própria; a ordenação e a paginação ficam no TanStack Table nas telas
export function Table({ className, caption, children }: { className?: string; caption: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-border bg-surface-raised", className)}>
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("border-b border-border bg-surface px-3 py-2.5 text-left text-xs font-semibold text-muted", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b border-border px-3 py-3 align-middle", className)} {...props} />;
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-surface [&:last-child>td]:border-b-0", className)} {...props} />;
}
