import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { expect, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const PASSWORD = "teste-123456";
export const USERS = {
  gestor: "gestor@teste.local",
  tecnico: "tecnico@teste.local",
  operador: "operador@teste.local",
  admin: "admin@teste.local",
} as const;

const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.test.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

// Acesso direto ao banco local para preparar e conferir (só testes)
export const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

export const iphone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

export async function login(page: Page, email: string) {
  if (!page.url().includes("/login")) await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

export async function newSession(browser: Browser, email: string, mobile = false) {
  const ctx = await browser.newContext(mobile ? iphone : {});
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await login(page, email);
  return { ctx, page, errors };
}

// PNG de verdade (gradiente 64x48), para a compressão de imagem do app ter o que processar
export function testPng(seed = 0) {
  const w = 64, h = 48;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 3 + 1) + 1 + x * 3;
      raw[i] = (x * 4 + seed) & 255; raw[i + 1] = (y * 5) & 255; raw[i + 2] = 128;
    }
  }
  const crc = (buf: Buffer) => {
    let c = ~0;
    for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
    return ~c >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return {
    name: `foto-${seed}.png`,
    mimeType: "image/png",
    buffer: Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]),
  };
}

// Assina com "toque" de verdade no canvas
export async function sign(page: Page) {
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const b = (await canvas.boundingBox())!;
  await page.mouse.move(b.x + 30, b.y + b.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) await page.mouse.move(b.x + 30 + i * 20, b.y + b.height / 2 + (i % 2 ? -25 : 25));
  await page.mouse.up();
  await expect(canvas).toHaveAttribute("aria-label", /assinado/);
}

export const shot = (page: Page, name: string) =>
  page.screenshot({ path: resolve(__dirname, `../../replica/clone-screens/${name}.png`), fullPage: true });

// Imagem que de fato carregou (não só o <img> na página)
export async function expectImagesLoaded(page: Page, nameRe: RegExp) {
  const imgs = page.getByRole("img", { name: nameRe });
  await expect(imgs.first()).toBeVisible();
  for (const img of await imgs.all()) {
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
}
