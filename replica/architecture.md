# Arquitetura: Inovapet Manutenção (recriação das funções principais do Leankeep)

Uso interno da Inovapet Embalagens: 1 fábrica, ~20 usuários (gestores,
técnicos e operadores que abrem chamado). Duas "caras" do mesmo sistema:

- **Web desktop** para gestores: cadastros, planos, calendário, OS, painel, relatórios.
- **App do técnico e do operador como PWA**: o mesmo site, com telas próprias
  para celular, instalado na tela inicial do Android e do iPhone. Funciona
  offline, usa câmera, QR Code e assinatura. Não passa por loja.

Nome provisório "Inovapet Manutenção". O nome final sai do `/replica-brand`.

## Stack

| camada | escolha | por quê |
| --- | --- | --- |
| web + PWA | Next.js (App Router) + TypeScript, um projeto só | desktop e celular saem do mesmo código; um deploy |
| estilo | Tailwind + tokens do `/replica-design` | rápido e consistente |
| componentes | shadcn/ui (Radix) + TanStack Table | tabelas, filtros, modais e formulários prontos e acessíveis |
| offline (PWA) | Serwist (service worker) + Dexie (IndexedDB) + fila de envio própria | cache das telas e dos dados do técnico; fila que reenvia quando a rede volta |
| QR Code | `qrcode` (gerar etiquetas) + `@zxing/browser` (ler pela câmera) | o leitor nativo do navegador não existe no iPhone; a biblioteca funciona nos dois |
| assinatura | `signature_pad` | leve, funciona com toque |
| banco | Postgres no Supabase | um banco só; RLS faz o controle de acesso por perfil |
| acesso a dados | `@supabase/ssr` + supabase-js; SQL direto nas migrações | o RLS vale para web, app e sincronização igualmente; sem ORM para não duplicar as regras |
| login | Supabase Auth, e-mail + senha; contas criadas pelo admin | sem cadastro público: só quem a Inovapet cadastrar entra |
| arquivos | Supabase Storage, buckets privados `evidencias`, `assinaturas`, `documentos`, `ativos` | fotos e PDFs com link temporário assinado |
| tarefas agendadas | `pg_cron` no Supabase | gerar preventivas (diário) e checar SLA (15 min) dentro do banco, sem servidor extra |
| tempo real | Supabase Realtime em `notifications` e `work_orders` | o sino e a lista de OS se atualizam sozinhos |
| PDF | `@react-pdf/renderer` em route handler | OS com fotos e assinaturas; relatório mensal |
| Excel | `exceljs` | exportações com formatação |
| gráficos | Recharts | painel e indicadores |
| e-mail (opcional) | Resend | aviso por e-mail, desligado por padrão (fica em Configurações) |
| pagamentos | nenhum | uso interno |
| hospedagem | Vercel | deploy do Next.js sem configuração; preview de cada mudança |
| testes | Vitest (regras), Playwright (fluxos, incluindo celular e offline) | o `/replica-test` usa os dois |

**Custos e contas.** O plano gratuito da Vercel (Hobby) é só para uso não
comercial; como o sistema serve a uma empresa, use o plano **Pro**. O plano
gratuito do Supabase pausa o projeto sem uso e não tem backup automático, então
para produção use o **Pro**. Para desenvolver e testar, os gratuitos bastam.
As contas são criadas por você, em nome da Inovapet; eu não crio contas nem
digito senhas.

## Schema

Arquivo: `replica/schema.sql` (vira a primeira migração em
`supabase/migrations/`). **26 tabelas, 5 views, RLS em todas as tabelas.**
Testado em Postgres 16 com os 7 cenários do fim deste documento.

| grupo | tabelas |
| --- | --- |
| pessoas | `profiles` (perfil admin / manager / technician / requester), `teams`, `profile_areas` |
| locais e ativos | `sites`, `areas` (com sub-área), `systems`, `assets` (tag única, criticidade, `qr_token`, `extra` jsonb), `asset_downtimes` |
| checklists | `checklist_templates`, `checklist_items` (texto, número, leitura com faixa, foto, seleção, sim/não; obrigatório; crítico) |
| planos | `maintenance_plans` (a cada N dias / semanas / meses / anos), `plan_assets` |
| OS | `work_orders`, `work_order_technicians`, `checklist_answers`, `attachments`, `signatures`, `time_entries`, `work_order_events` |
| chamados e SLA | `categories`, `sla_rules` |
| materiais | `materials`, `material_requests` (custo em centavos + moeda) |
| outros | `documents`, `notifications`, `settings` (linha única) |
| indicadores (views) | `v_asset_mttr`, `v_asset_mtbf`, `v_sla_monthly`, `v_plan_adherence`, `v_work_order_hours` |

**Acesso (RLS):**

| perfil | vê | altera |
| --- | --- | --- |
| admin | tudo | tudo, incluindo usuários e configurações |
| gestor | tudo | cadastros, planos, OS, atribuições |
| técnico | cadastros; OS atribuídas a ele ou das áreas dele (sem áreas = todas) | execução das OS que vê: status, checklist, fotos, assinatura, horas, materiais |
| solicitante | só os chamados que ele abriu | abre chamado; depois só avalia e reabre (trava no banco) |

**Regras que ficam no banco**, porque o app offline sincroniza escrevendo
direto e a regra tem que valer em qualquer caminho:

- **OS concluída exige** todos os itens obrigatórios e críticos respondidos e
  a assinatura do técnico (configurável). O banco recusa o contrário.
- **Prazos de SLA** calculados na abertura pela regra mais específica
  (categoria + prioridade, senão só prioridade).
- **Tempos** de primeira ação, início e conclusão carimbados na mudança de
  status. Reabrir conta em `reopen_count`.
- **Leitura fora da faixa** marcada automaticamente.
- **Resposta antiga não sobrescreve resposta nova** (reenvio offline fora de ordem).
- **Preventivas sem duplicata**: índice único (plano, equipamento, dia). O
  gerador pode rodar quantas vezes quiser.
- **Linha do tempo e notificações** gravadas por trigger: OS criada,
  atribuída, mudou de status, reaberta, avaliada.

## API

Server actions do Next.js para os formulários e route handlers para o que
precisa de URL. Toda chamada usa a sessão do usuário, e o RLS decide.

**F01 Cadastro do parque**

| método caminho | faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| action `saveArea` | cria/edita setor | gestor | site, pai, nome | área |
| action `saveAsset` | cria/edita equipamento | gestor | campos do S06, foto | ativo |
| POST /api/assets/import | importa planilha (.xlsx/.csv), valida e mostra prévia antes de gravar | gestor | arquivo | linhas ok / erros por linha |
| GET /api/assets/qr-labels?ids= | PDF com etiquetas QR para imprimir | gestor | ids, tamanho | PDF |
| GET /q/:qr_token | página do QR: ficha do ativo (técnico) ou abrir chamado (solicitante) | logado | token | redirect |

**F02 Planos preventivos**

| método caminho | faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| action `saveChecklistTemplate` | modelo e itens (ordem, tipo, faixa) | gestor | modelo + itens | modelo |
| action `savePlan` | plano + equipamentos; chama `reschedule_plan()` | gestor | campos do S10 | plano, nº de OS geradas |
| GET /api/plans/:id/preview | próximas 12 datas | gestor | — | datas |
| action `moveWorkOrder` | remarcar no calendário | gestor | os, nova data | OS |

**F03 / F06 / F08 Execução no app (incluindo offline)**

| método caminho | faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| GET /api/sync/pull?since= | pacote do técnico: OS abertas dele/das áreas (−7 a +14 dias), itens de checklist, ativos das áreas, materiais | técnico | carimbo da última sync | dados alterados desde então |
| POST /api/sync/push | aplica a fila do celular em ordem, cada operação com uuid próprio (reenvio não duplica) | técnico | lista de operações | resultado por operação: ok / conflito / erro |
| POST /api/uploads/sign | URL assinada para subir foto/assinatura direto no Storage | técnico, solicitante | os, tipo, tamanho | URL |
| action `requestMaterial` | pedido ao almoxarifado | técnico | os, material ou texto, qtd | pedido |

Operações da fila: `answer.upsert`, `attachment.add`, `signature.add`,
`time.add`, `wo.status`, `wo.create` (chamado aberto offline),
`material.request`.

**F04 / F05 / F07 Chamados**

| método caminho | faz | quem | entrada | saída |
| --- | --- | --- | --- | --- |
| action `openTicket` | abre corretiva (web, app, QR) | todos | ativo, descrição, prioridade, categoria, fotos, máquina parada? | OS |
| action `assignTechnicians` | atribui um ou mais técnicos | gestor | os, técnicos | OS |
| action `updateWorkOrder` | prioridade, categoria, status, cancelar com motivo | gestor | — | OS |
| action `rateTicket` / `reopenTicket` | avaliar ou reabrir | solicitante | nota, comentário | OS |
| action `decideMaterial` | aprovar / negar / entregue | gestor | pedido, decisão, custo | pedido |

**F09 Indicadores e relatórios**

| método caminho | faz | quem | saída |
| --- | --- | --- | --- |
| GET /api/dashboard?from&to&area&system | números e séries do painel | gestor | JSON |
| GET /api/reports/work-order/:id.pdf | OS completa com fotos e assinaturas | quem vê a OS | PDF |
| GET /api/reports/:tipo.(pdf|xlsx)?filtros | OS do período, preventivas, calendário, ativos, horas técnicas, SLA | gestor | arquivo; acima de 3 meses vai por e-mail em segundo plano |

**F10 Configuração**

| método caminho | faz | quem |
| --- | --- | --- |
| action `inviteUser` | cria a conta no Supabase Auth (Admin API, só no servidor) e o perfil; manda o convite | admin |
| action `saveSettings` / `saveSlaRule` / `saveCategory` | configurações | admin |

**Tarefas agendadas (pg_cron):**

| nome | quando | faz |
| --- | --- | --- |
| `preventivas-diarias` | 03:00 em Brasília | `generate_preventive_work_orders()`: cria as OS até o horizonte (60 dias, configurável) |
| `sla-15min` | a cada 15 min | `check_sla()`: avisa SLA em risco (80%) e estourado, sem repetir aviso |
| `documentos-vencendo` (should) | diário | avisa garantias e certificados a 30 dias do vencimento |

Webhooks: nenhum na entrada. Saída: e-mail opcional via Resend. Sem
integração com o Leankeep nem com APIs dele.

## As partes difíceis

- **Offline e sincronização (a maior).** O celular guarda as OS e a fila no
  IndexedDB. Cada operação tem uuid próprio, então reenviar não duplica. Fotos
  são reduzidas no celular (~1600 px, JPEG ~80%, < 1 MB) antes de subir; o
  limite no banco é 10 MB. Conflito: se a OS foi cancelada ou reatribuída na
  web enquanto o técnico estava offline, a operação volta como "conflito" e o
  app mostra o aviso, nunca apaga o trabalho dele em silêncio. Respostas de
  checklist: vence a mais recente pelo horário do celular.
- **iPhone.** O PWA precisa ser **instalado na tela de início** pelo Safari.
  Sem isso, o iOS pode apagar os dados offline após dias sem uso, e
  notificações push não funcionam (só com o PWA instalado, iOS 16.4+). O
  primeiro acesso no celular terá uma tela "Instale o app" com o passo a passo.
- **Fuso horário.** Tudo é gravado em UTC; dias de calendário (data prevista
  da preventiva) em `date` no fuso America/Sao_Paulo. O Brasil está sem
  horário de verão desde 2019, mas o código não assume isso.
- **Preventivas mensais no dia 31.** Calculadas como início + k meses (31/jan
  → 28/fev → 31/mar), sem deriva. Testado.
- **Mudança de plano.** `reschedule_plan()` apaga só as futuras ainda não
  iniciadas e regera; as em andamento e concluídas ficam.
- **Duas pessoas na mesma OS.** Vários técnicos por OS são permitidos; a
  conclusão é de quem fechar primeiro, e o banco recusa concluir duas vezes
  sem reabrir.
- **SLA parado por falta de material.** Decisão da v1: o relógio **não
  para**; o relatório de SLA mostra quanto tempo a OS ficou em
  "aguardando material" para explicar o atraso. Dá para mudar depois.
- **MTBF.** Até haver registro de paradas, é o intervalo médio entre
  corretivas. Com `asset_downtimes` preenchido, passa a ser tempo de operação ÷
  falhas.
- **Numeração de OS.** Sequencial, mas pode pular números (o gerador reserva
  um número a cada tentativa). Não é problema para uso interno.
- **Relatórios grandes.** O original é lento aqui (segundo as avaliações).
  Até 3 meses o arquivo sai na hora; acima disso, é gerado em segundo plano e
  enviado por e-mail ou fica para baixar.
- **LGPD.** Dados de funcionários (nome, e-mail, assinatura). Usuário
  desligado é desativado, não apagado, para preservar o histórico das OS.
- **Backup.** Plano pago do Supabase com backup diário. Exportação completa em
  Excel disponível para o admin.

## Ordem de construção

Cada entrega é usável na fábrica antes da próxima começar.

**0. Fatia vertical (primeiros dias)**
Login → admin cadastra 1 setor e 1 equipamento → operador abre um chamado
pelo QR no celular → técnico conclui com 1 foto e assinatura → gestor vê a OS
concluída.
Telas: S01, S04, S06, S14, S13, M01, M02, M05. Tabelas: profiles, sites,
areas, assets, work_orders, attachments, signatures. Rotas: `/q/:token`,
`openTicket`, `uploads/sign`.

**1. Entrega 1: corretivas (2–3 semanas)**
Usuários e perfis (S20), hierarquia (S03), ficha do ativo e etiquetas QR (S05,
S07), lista e detalhe das OS com filtros (S12, S13), atribuir técnicos,
cancelar, categorias e prioridades (S21), notificações no sistema. App:
minhas OS, QR, ficha, executar, assinar, abrir chamado (M01–M06), **ainda
online**.

**2. Entrega 2: preventivas (2 semanas)**
Modelos de checklist (S08), planos e editor (S09, S10), geração automática
(pg_cron), calendário (S11), checklist completo no app com leitura fora da
faixa e bloqueio de encerramento.

**3. Entrega 3: completo (2–3 semanas)**
**Modo offline** com fila e sincronização (M08), regras e alertas de SLA,
painel (S02), indicadores MTTR, MTBF, SLA e aderência (S19), relatórios
PDF/Excel (S18), relatório de OS em PDF.

**4. Importantes (should), depois opcionais (could)**
Importar planilha de equipamentos, portal do solicitante, avaliação e
reabertura, materiais (S16, M07), documentos (S17), horas técnicas, linha do
tempo. Depois: kanban, arrastar no calendário, edição de foto, e-mail, push,
estoque, gatilho por horímetro, registro de paradas.

**5. Correções do `/replica-entrepreneur`**: pulado (uso interno). Das
avaliações do original já entram: notificações que funcionam, controle de
e-mail nas configurações e relatórios que não travam.

## Cenários testados no schema (Postgres 16)

1. Preventiva mensal começando em 31/jan gera 31/out e 30/nov, já atribuída;
   rodar de novo gera 0.
2. Operador abre chamado pelo QR: a área é corrigida pelo equipamento, e o SLA
   de 120 min vem da regra categoria + prioridade; ele vê só o próprio
   chamado e não consegue mudar a prioridade.
3. Técnico da Injeção vê as OS da Injeção; técnico do Sopro vê 0 e não
   consegue responder checklist delas.
4. Concluir sem o item crítico é recusado; sem assinatura é recusado; uma
   resposta offline mais antiga não sobrescreve a nova; 175 bar fica marcado
   fora da faixa de 120–160.
5. Operador avalia e reabre; linha do tempo e notificações corretas.
6. SLA estourado avisa gestor e técnico uma vez só; MTTR por equipamento = 3 h.
7. Plano muda para quinzenal: as futuras são recriadas a cada 14 dias.
