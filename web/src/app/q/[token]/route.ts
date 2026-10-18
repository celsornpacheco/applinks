import { NextResponse, type NextRequest } from "next/server";
import { getMe } from "@/lib/auth";
import { qrDestination } from "@/lib/qr-destination";

// Endereço gravado na etiqueta QR (lido pela câmera do celular)
export async function GET(request: NextRequest, ctx: RouteContext<"/q/[token]">) {
  const { token } = await ctx.params;
  const me = await getMe();
  const to = (path: string) => NextResponse.redirect(new URL(path, request.url));
  if (!me) return to(`/login?next=${encodeURIComponent(`/q/${token}`)}`);
  return to(await qrDestination(token, me));
}
