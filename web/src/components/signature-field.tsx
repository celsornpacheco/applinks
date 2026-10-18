"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

// Assinatura com o dedo. Devolve um PNG (data URL) ou null quando limpa.
export function SignatureField({ label, onChange }: { label: string; onChange: (png: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const pad = useRef<SignaturePad | null>(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const el = canvas.current!;
    const p = new SignaturePad(el, { penColor: "#141a22", backgroundColor: "rgba(0,0,0,0)" });
    pad.current = p;

    // canvas nítido em tela retina e redimensionado com a página
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = p.toData();
      el.width = el.offsetWidth * ratio;
      el.height = el.offsetHeight * ratio;
      el.getContext("2d")!.scale(ratio, ratio);
      p.clear();
      p.fromData(data);
    };
    resize();
    window.addEventListener("resize", resize);

    const end = () => {
      setEmpty(p.isEmpty());
      onChange(p.isEmpty() ? null : p.toDataURL("image/png"));
    };
    p.addEventListener("endStroke", end);
    return () => {
      window.removeEventListener("resize", resize);
      p.removeEventListener("endStroke", end);
      p.off();
    };
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={empty}
          onClick={() => {
            pad.current?.clear();
            setEmpty(true);
            onChange(null);
          }}
        >
          <Eraser aria-hidden />Limpar
        </Button>
      </div>
      <canvas
        ref={canvas}
        className="h-44 w-full touch-none rounded-md border border-dashed border-border-input bg-bg"
        role="img"
        aria-label={empty ? `${label}: em branco. Assine com o dedo.` : `${label}: assinado`}
      />
    </div>
  );
}
