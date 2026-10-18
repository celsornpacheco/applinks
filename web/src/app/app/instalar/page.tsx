import type { Metadata } from "next";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Instalar o app" };

const steps = {
  iPhone: [
    "Abra este endereço no Safari (no Chrome do iPhone não funciona).",
    "Toque no botão Compartilhar (o quadrado com a seta para cima), na barra de baixo.",
    "Role a lista e toque em “Adicionar à Tela de Início”.",
    "Toque em Adicionar. O ícone “Manutenção” aparece na tela inicial.",
    "Abra sempre pelo ícone: assim os avisos e o modo offline funcionam.",
  ],
  Android: [
    "Abra este endereço no Chrome.",
    "Toque nos três pontinhos, no canto de cima.",
    "Toque em “Instalar app” (ou “Adicionar à tela inicial”).",
    "Confirme. O ícone “Manutenção” aparece junto dos outros apps.",
  ],
};

export default function InstallPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl">Instalar o app</h1>
      <p className="text-sm text-muted">
        O app não está na App Store nem no Google Play: ele é instalado pelo navegador, em menos de um minuto, e se atualiza sozinho.
      </p>
      {Object.entries(steps).map(([phone, list]) => (
        <Card key={phone} className="p-4">
          <h2 className="mb-3 text-lg">{phone}</h2>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-base">
            {list.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </Card>
      ))}
    </div>
  );
}
