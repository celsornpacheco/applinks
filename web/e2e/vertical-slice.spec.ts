import { expect, test } from "@playwright/test";
import { db, expectImagesLoaded, iphone, login, newSession, shot, sign, testPng, USERS } from "./helpers";

// F01 + F04 + F05 + F03 (corretiva) + F07: o ciclo central de ponta a ponta
test("cadastro → chamado pelo QR → atribuição → execução com foto e assinatura → concluída", async ({ browser }) => {
  const tag = `EXT-${Date.now().toString().slice(-5)}`;
  const problem = `Vazamento de óleo na rosca ${tag}`;

  // 1. Gestor cadastra um equipamento
  const gestor = await newSession(browser, USERS.gestor);
  await expect(gestor.page).toHaveURL("/");
  await gestor.page.goto("/ativos/novo");
  await gestor.page.getByLabel("Tag").fill(tag);
  await gestor.page.getByLabel("Nome").fill("Extrusora de teste");
  await gestor.page.getByLabel("Setor").selectOption({ label: "Extrusão" });
  await gestor.page.getByLabel("Criticidade").selectOption("high");
  await gestor.page.getByRole("button", { name: "Cadastrar equipamento" }).click();
  await expect(gestor.page.getByRole("heading", { name: new RegExp(tag) })).toBeVisible();
  await expect(gestor.page.getByRole("img", { name: `QR Code do equipamento ${tag}` })).toBeVisible();
  await shot(gestor.page, "S05-ficha-equipamento");

  const { data: asset } = await db.from("assets").select("id, qr_token").eq("tag", tag).single();
  expect(asset).toBeTruthy();

  // 2. Operador lê o QR no celular: cai no login e depois direto no chamado daquela máquina
  const opCtx = await browser.newContext(iphone);
  const op = await opCtx.newPage();
  await op.goto(`/q/${asset!.qr_token}`);
  await expect(op).toHaveURL(/\/login\?next=/);
  await login(op, USERS.operador);
  await expect(op).toHaveURL(new RegExp(`/app/chamado\\?ativo=${asset!.id}`));
  await expect(op.getByText(`${tag} · Extrusora de teste`)).toBeVisible();
  await op.getByLabel("O que aconteceu?").fill(problem);
  await op.getByLabel("Prioridade").selectOption("high");
  await op.getByLabel("A máquina está parada").check();
  await op.locator('input[type="file"]').setInputFiles(testPng(1));
  await expect(op.getByRole("img", { name: "Foto 1" })).toBeVisible();
  await shot(op, "S14-abrir-chamado-celular");
  await op.getByRole("button", { name: "Enviar chamado" }).click();
  await expect(op).toHaveURL(/\/app\/os\//);
  await expect(op.getByRole("heading", { name: problem })).toBeVisible();
  await expect(op.getByRole("img", { name: "Foto 1 da OS" })).toBeVisible();
  const woId = op.url().split("/app/os/")[1];

  const { data: wo } = await db.from("work_orders").select("number, status, origin, area_id, resolution_due_at, machine_stopped").eq("id", woId).single();
  expect(wo).toMatchObject({ status: "open", origin: "qr", machine_stopped: true });
  expect(wo!.resolution_due_at).toBeTruthy(); // SLA calculado pelo banco

  // 3. Gestor vê o chamado e atribui o técnico
  await gestor.page.goto("/os");
  await expect(gestor.page.getByRole("link", { name: `#${wo!.number}` })).toBeVisible();
  await shot(gestor.page, "S12-lista-os");
  await gestor.page.getByRole("link", { name: `#${wo!.number}` }).click();
  await gestor.page.getByLabel("Atribuir técnico").selectOption({ label: "Tiago Técnico" });
  await gestor.page.getByRole("button", { name: "Atribuir" }).click();
  await expect(gestor.page.getByText("Técnico atribuído. Ele foi avisado.")).toBeVisible();

  // 4. Técnico no celular: inicia, tenta concluir sem assinatura, assina, conclui
  const tec = await newSession(browser, USERS.tecnico, true);
  await expect(tec.page).toHaveURL("/app");
  await expect(tec.page.getByText(problem)).toBeVisible();
  await shot(tec.page, "M01-minhas-os");
  await tec.page.getByText(problem).click();
  await tec.page.getByRole("button", { name: "Iniciar atendimento" }).click();
  await expect(tec.page.getByRole("button", { name: "Concluir OS" })).toBeVisible();

  await tec.page.getByRole("button", { name: "Concluir OS" }).click();
  await expect(tec.page.getByText(/não pode ser concluída: falta a assinatura do técnico/)).toBeVisible();

  await tec.page.locator('input[type="file"]').setInputFiles(testPng(2));
  await expect(tec.page.getByText("Fotos (2)")).toBeVisible();
  await sign(tec.page);
  await shot(tec.page, "M04-executar-os");
  await tec.page.getByRole("button", { name: "Concluir OS" }).click();
  await expect(tec.page).toHaveURL("/app");
  await expect(tec.page.getByText(`OS #${wo!.number} concluída`)).toBeVisible();

  // 5. Gestor vê concluída, com fotos, assinatura e linha do tempo
  await gestor.page.reload();
  await expect(gestor.page.getByText("Concluída").first()).toBeVisible();
  await expect(gestor.page.getByRole("heading", { name: "Fotos (2)" })).toBeVisible();
  await expectImagesLoaded(gestor.page, /^Foto \d$/);
  await expectImagesLoaded(gestor.page, /^Assinatura de Tiago Técnico$/);
  await expect(gestor.page.getByText("Técnico atribuído: Tiago Técnico")).toBeVisible();
  await shot(gestor.page, "S13-detalhe-os");

  const { data: done } = await db.from("work_orders").select("status, first_action_at, started_at, completed_at").eq("id", woId).single();
  expect(done!.status).toBe("done");
  expect(done!.first_action_at && done!.started_at && done!.completed_at).toBeTruthy();

  // 6. Operador recebeu o aviso de concluído
  await op.goto("/app/avisos");
  await expect(op.getByText(`Chamado #${wo!.number} concluído`)).toBeVisible();

  for (const s of [gestor, tec]) expect(s.errors).toEqual([]);
});

test("operador não vê chamados de outros nem a área do gestor", async ({ browser }) => {
  const op = await newSession(browser, USERS.operador, true);
  await op.page.goto("/os");
  await expect(op.page).toHaveURL("/app"); // área do gestor manda de volta para o app
  const { data: others } = await db.from("work_orders").select("id").neq("opened_by", (await db.from("profiles").select("id").eq("email", USERS.operador).single()).data!.id).limit(1);
  if (others?.length) {
    await op.page.goto(`/app/os/${others[0].id}`);
    await expect(op.page.getByText("404").or(op.page.getByText(/não encontrad/i))).toBeVisible();
  }
});
