"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, X } from "lucide-react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

const DISMISS_KEY = "instalar-dispensado";

// Faixa no app pedindo para instalar. Some quando já está instalado ou se a pessoa fechar.
export function InstallBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- só dá para saber no navegador
    setShow(!standalone && !dismissed);
  }, []);
  if (!show) return null;
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-accent bg-info-bg p-3 text-info-fg">
      <Download className="size-5 shrink-0" aria-hidden />
      <Link href="/app/instalar" className="flex-1 text-sm font-semibold underline-offset-2 hover:underline">
        Instale o app na tela inicial do celular
      </Link>
      <button
        className="rounded-md p-1.5 hover:bg-bg/60"
        aria-label="Dispensar"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {}
          setShow(false);
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
