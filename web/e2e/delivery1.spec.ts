import { expect, test } from "@playwright/test";
import { db, newSession, USERS } from "./helpers";

const TANIA = "tecnico2@teste.local";

test("técnico limitado a um setor só vê as OS desse setor", async ({ browser }) => {
  const admin = await newSession(browser, USERS.admin);
  const { data: tania } = await db.from("profiles").select("id").eq("email", TANIA).single();

  // admin restringe a Tânia ao setor Sopro
  await admin.page.goto(`/config/usuarios/${tania!.id}`);
  for (const box of await admin.page.getByRole("checkbox").all()) await box.uncheck();
  await admin.page.getByRole("checkbox", { name: "Sopro" }).check();
  await admin.page.getByRole("button", { name: "Salvar" }).click();
  await expect(admin.page.getByText("Usuário salvo")).toBeVisible();

  // gestor abre uma OS na Injeção pelo computador
  const gestor = await newSession(browser, USERS.gestor);
  const title = `Ruído no motor da injetora ${Date.now()}`;
  await gestor.page.goto("/os");
  await gestor.page.getByRole("link", { name: "Nova OS" }).click();
  await gestor.page.getByLabel("Equipamento").selectOption({ label: "INJ-03 · Injetora 03" });
  await gestor.page.getByLabel("O que aconteceu?").fill(title);
  await gestor.page.getByRole("button", { name: "Enviar chamado" }).click();
  await expect(gestor.page).toHaveURL(/\/os\/[0-9a-f-]{36}$/);
  await expect(gestor.page.getByRole("heading", { name: new RegExp(title) })).toBeVisible();

  // Tânia (só Sopro) não vê; Tiago (sem setor definido = todos) vê
  const tania2 = await newSession(browser, TANIA, true);
  await expect(tania2.page.getByRole("heading", { name: "Minhas OS" })).toBeVisible();
  await expect(tania2.page.getByText(title)).toHaveCount(0);
  const tiago = await newSession(browser, USERS.tecnico, true);
  await expect(tiago.page.getByText(title)).toBeVisible();

  // filtro por técnico na lista do gestor
  const woId = gestor.page.url().split("/os/")[1];
  await gestor.page.getByLabel("Atribuir técnico").selectOption({ label: "Tiago Técnico" });
  await gestor.page.getByRole("button", { name: "Atribuir" }).click();
  await expect(gestor.page.getByText("Técnico atribuído. Ele foi avisado.")).toBeVisible();
  const { data: wo } = await db.from("work_orders").select("number").eq("id", woId).single();
  await gestor.page.goto(`/os?ver=abertas&tecnico=${(await db.from("profiles").select("id").eq("email", USERS.tecnico).single()).data!.id}`);
  await expect(gestor.page.getByRole("link", { name: `#${wo!.number}` })).toBeVisible();
  await gestor.page.goto(`/os?ver=abertas&tecnico=${tania!.id}`);
  await expect(gestor.page.getByRole("link", { name: `#${wo!.number}` })).toHaveCount(0);

  // volta a Tânia para "todos os setores" (não atrapalha os outros testes)
  await db.from("profile_areas").delete().eq("profile_id", tania!.id);
});

test("mudar o prazo de SLA vale para os chamados novos", async ({ browser }) => {
  const gestor = await newSession(browser, USERS.gestor);
  await gestor.page.goto("/config/chamados");
  await gestor.page.getByLabel("Solução, prioridade Alta").fill("2");
  await gestor.page.getByRole("button", { name: "Salvar prazos" }).click();
  await expect(gestor.page.getByText("Prazos salvos")).toBeVisible();

  await gestor.page.goto("/os/nova");
  await gestor.page.getByLabel("Equipamento").selectOption({ label: "CHL-01 · Chiller 01" });
  await gestor.page.getByLabel("O que aconteceu?").fill("Temperatura da água alta");
  await gestor.page.getByLabel("Prioridade").selectOption("high");
  await gestor.page.getByRole("button", { name: "Enviar chamado" }).click();
  await expect(gestor.page).toHaveURL(/\/os\/[0-9a-f-]{36}$/);
  const { data: wo } = await db.from("work_orders").select("opened_at, resolution_due_at").eq("id", gestor.page.url().split("/os/")[1]).single();
  expect((new Date(wo!.resolution_due_at!).getTime() - new Date(wo!.opened_at).getTime()) / 60000).toBe(120);

  // restaura o padrão (8 h)
  await gestor.page.goto("/config/chamados");
  await gestor.page.getByLabel("Solução, prioridade Alta").fill("8");
  await gestor.page.getByRole("button", { name: "Salvar prazos" }).click();
  await expect(gestor.page.getByText("Prazos salvos")).toBeVisible();
});

test("app instalável: manifesto, ícones, service worker e página offline abrem sem login", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const m = await manifest.json();
  expect(m).toMatchObject({ display: "standalone", start_url: "/app", short_name: "Manutenção" });
  for (const path of ["/icons/icon-192.png", "/icons/icon-512.png", "/sw.js", "/offline.html"]) {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.status(), path).toBe(200);
  }
});
