"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { IScannerControls } from "@zxing/browser";
import { CameraOff, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

// Lê o QR da etiqueta pela câmera traseira. Se a câmera for negada, dá para digitar a tag.
export function Scanner({ notFound }: { notFound?: boolean }) {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string>();
  const [tag, setTag] = useState("");

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let stopped = false;
    (async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          video.current!,
          (result) => {
            if (!result || stopped) return;
            const text = result.getText();
            // só segue QR do próprio sistema: /q/<código>
            const match = text.match(/\/q\/([A-Za-z0-9_-]{6,})/);
            if (!match) return setCameraError("Este QR não é de um equipamento cadastrado.");
            stopped = true;
            controls?.stop();
            // navegação completa: /q/ é rota de API que redireciona
            window.location.assign(`/q/${match[1]}`);
          },
        );
        if (stopped) controls.stop();
      } catch (e) {
        const name = (e as Error).name;
        setCameraError(
          name === "NotAllowedError"
            ? "A câmera foi bloqueada. Libere o acesso nas configurações do navegador ou digite a tag abaixo."
            : "Não foi possível abrir a câmera. Digite a tag do equipamento abaixo.",
        );
      }
    })();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [router]);

  return (
    <div className="flex flex-col gap-4">
      {notFound && (
        <p role="alert" className="rounded-md bg-urgent-bg px-3 py-2 text-sm text-urgent-fg">
          Equipamento não encontrado. A etiqueta pode ser antiga: avise a manutenção.
        </p>
      )}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-sidebar">
        <video ref={video} className="size-full object-cover" muted playsInline aria-label="Imagem da câmera" />
        {!cameraError && <div className="pointer-events-none absolute inset-[18%] rounded-lg border-4 border-on-accent/80" aria-hidden />}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-on-sidebar">
            <CameraOff className="size-8" aria-hidden />
            <p className="text-sm">{cameraError}</p>
          </div>
        )}
      </div>
      <p className="text-center text-sm text-muted">Aponte para a etiqueta QR da máquina.</p>

      <Card className="p-4">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (tag.trim()) router.push(`/app/ativo/tag/${encodeURIComponent(tag.trim().toUpperCase())}`);
          }}
        >
          <Field label="Ou digite a tag" className="flex-1">
            {({ id }) => <Input id={id} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="INJ-03" className="h-12 font-mono uppercase" />}
          </Field>
          <Button type="submit" size="lg" aria-label="Buscar"><Search aria-hidden /></Button>
        </form>
      </Card>
    </div>
  );
}
