import type { Metadata } from "next";
import { requireMe } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { assetQrPath, qrSvg, siteUrl } from "@/lib/qr";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Etiquetas QR" };

// Página só para imprimir: etiquetas de 5 x 6 cm com QR, tag e nome
export default async function LabelsPage({ searchParams }: PageProps<"/etiquetas">) {
  await requireMe(["admin", "manager"]);
  const { ids } = await searchParams;
  const list = (typeof ids === "string" ? ids.split(",") : []).filter(Boolean).slice(0, 200);
  const supabase = await createClient();
  const { data: assets } = list.length
    ? await supabase.from("assets").select("id, tag, name, qr_token, areas(name)").in("id", list).order("tag")
    : { data: [] };
  const base = await siteUrl();
  const labels = await Promise.all(
    (assets ?? []).map(async (a) => ({ ...a, svg: await qrSvg(base + assetQrPath(a.qr_token)) })),
  );

  return (
    <main className="min-h-dvh bg-bg p-6 print:p-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">{labels.length} etiqueta(s). Use papel adesivo e imprima em tamanho real (100%).</p>
        <PrintButton />
      </div>
      <div className="flex flex-wrap gap-3 print:gap-0">
        {labels.map((a) => (
          <div key={a.id} className="flex h-[6cm] w-[5cm] break-inside-avoid flex-col items-center justify-center gap-1 border border-dashed border-border-input p-2 text-center">
            <div className="w-[3.6cm]" role="img" aria-label={`QR ${a.tag}`} dangerouslySetInnerHTML={{ __html: a.svg }} />
            <p className="font-mono text-base leading-tight font-bold">{a.tag}</p>
            <p className="line-clamp-2 text-xs leading-tight">{a.name}</p>
            <p className="text-xs leading-tight font-normal text-muted">{a.areas?.name}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
