import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

// Endereço público do sistema; em produção vem de NEXT_PUBLIC_SITE_URL, senão do próprio pedido
export async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export const assetQrPath = (token: string) => `/q/${token}`;

// SVG nítido em qualquer tamanho de impressão; margem 1 = área branca mínima que o leitor precisa
export async function qrSvg(text: string) {
  return QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1, color: { dark: "#000000", light: "#ffffff" } });
}
