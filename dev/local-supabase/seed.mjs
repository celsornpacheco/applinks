// Usuários e equipamentos de teste no Supabase LOCAL (nunca em produção).
// Uso: node dev/local-supabase/seed.mjs   (lê web/.env.test.local)
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "../../web/node_modules/@supabase/supabase-js/dist/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(here, "../../web/.env.test.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes("127.0.0.1")) throw new Error("seed só roda no Supabase local");

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
export const PASSWORD = "teste-123456";

const people = [
  { email: "admin@teste.local", full_name: "Ana Admin", role: "admin" },
  { email: "gestor@teste.local", full_name: "Gustavo Gestor", role: "manager" },
  { email: "tecnico@teste.local", full_name: "Tiago Técnico", role: "technician" },
  { email: "tecnico2@teste.local", full_name: "Tânia Técnica", role: "technician" },
  { email: "operador@teste.local", full_name: "Otávio Operador", role: "requester" },
];

const { data: list } = await db.auth.admin.listUsers();
for (const p of people) {
  let user = list.users.find((u) => u.email === p.email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({ email: p.email, password: PASSWORD, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db.from("profiles").upsert({ id: user.id, email: p.email, full_name: p.full_name, role: p.role });
  if (error) throw error;
}

const { data: areas } = await db.from("areas").select("id, name");
const { data: systems } = await db.from("systems").select("id, name");
const area = (n) => areas.find((a) => a.name === n).id;
const sys = (n) => systems.find((s) => s.name === n).id;
const assets = [
  { tag: "INJ-03", name: "Injetora 03", area_id: area("Injeção"), system_id: sys("Hidráulico"), manufacturer: "Fabricante A", model: "IN-250", criticality: "critical" },
  { tag: "SOP-02", name: "Sopradora PET 02", area_id: area("Sopro"), system_id: sys("Pneumático"), manufacturer: "Fabricante B", model: "SB-4", criticality: "high" },
  { tag: "CMP-01", name: "Compressor parafuso 01", area_id: area("Utilidades"), system_id: sys("Pneumático"), criticality: "high" },
  { tag: "CHL-01", name: "Chiller 01", area_id: area("Utilidades"), system_id: sys("Refrigeração"), criticality: "medium" },
];
const { error } = await db.from("assets").upsert(assets, { onConflict: "tag" });
if (error) throw error;
console.log(`seed: ${people.length} usuários (senha ${PASSWORD}), ${assets.length} equipamentos`);
