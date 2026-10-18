import type { Metadata } from "next";
import { Scanner } from "./scanner";

export const metadata: Metadata = { title: "Ler QR" };

export default async function QrPage({ searchParams }: PageProps<"/app/qr">) {
  const { erro } = await searchParams;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl">Ler QR Code</h1>
      <Scanner notFound={erro === "nao-encontrado"} />
    </div>
  );
}
