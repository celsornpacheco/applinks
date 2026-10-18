# Componentes: Inovapet Manutenção

Código em `web/src/components/`. Vitrine viva em `/design` (capturas em
`replica/design/screens/`). Tokens em `tokens.json` → `npm --prefix web run tokens`
→ `web/src/app/tokens.css`. Os componentes usam só classes de token
(`bg-surface`, `text-muted`, `border-border-input`...), nunca hex.

Regras gerais:
- **Celular com luva e sol forte:** alvo de toque mínimo de 48 px no app,
  texto base 16 px, contraste AA em todos os pares (26 pares, 0 falhas).
- **Cor nunca sozinha:** status e SLA sempre com texto; SLA e leitura fora da faixa também com ícone.
- **Foco visível** em tudo: contorno de 2 px na cor `focus`.
- **Movimento reduzido** respeitado (`prefers-reduced-motion`).
- Ícones: Lucide (ISC). Fonte: Inter (OFL), embutida no app, sem Google Fonts, para funcionar offline.
- Sem dark mode na v1 (uso em fábrica e escritório claros); os tokens permitem acrescentar depois.

```
Button                                   ui/button.tsx
  variants  primary, secondary, ghost, danger
  sizes     sm 32px, md 40px, lg 48px (celular), icon 40px
  states    default, hover, focus-visible, disabled (50%), loading (spinner, aria-busy, rótulo mantido)
  tokens    accent / on-accent, accent-hover, danger / on-danger, border-input; radius md; text sm/600
  a11y      <button> real; botão só de ícone exige aria-label
  used on   todas

Field + Input / Textarea / Select        ui/field.tsx
  parts     rótulo, controle, dica, erro; * em obrigatório
  states    default, focus, erro (aria-invalid, borda danger, mensagem ligada por aria-describedby), disabled
  sizes     altura 44px (web e celular); Textarea mín. 96px
  notes     Select é o <select> nativo: no celular abre o seletor do sistema
  used on   S06, S10, S14, S15, S20, S21, M06, M07

Badge                                    ui/badge.tsx
  tones     info, progress, waiting, done, neutral, high, urgent (pares *-fg / *-bg, todos AA)
  derived   StatusBadge (6 status da OS), PriorityBadge (4), CriticalityBadge (4), KindBadge (preventiva/corretiva)
  used on   S04, S05, S12, S13, M01

SlaBadge                                 ui/badge.tsx
  states    ok (check), risk (relógio), breached (alerta) + tempo restante opcional
  used on   S12, S13, M01

Card / CardHeader / KpiCard              ui/card.tsx
  KpiCard   rótulo, valor (tabular), variação com seta; "good" diz se subir é bom (MTBF) ou ruim (MTTR)
  states    carregando (skeleton, aria-busy)
  used on   S02, S05, S19

Table / Th / Td / Tr                     ui/table.tsx
  notes     caption sr-only obrigatório; rolagem horizontal própria (nunca a página toda);
            ordenação, seleção e paginação via TanStack Table nas telas
  states    vazia → EmptyState; filtrada sem resultado → EmptyState com "Limpar filtros"
  used on   S04, S09, S12, S16, S17, S20

EmptyState                               ui/empty-state.tsx
  parts     ícone, título, descrição, ação opcional
  used on   todas as listas, M01

Tabs                                     ui/tabs.tsx (Radix)
  a11y      setas do teclado entre abas, role=tablist
  used on   S05 (Dados, Planos, Histórico, Documentos), S13, S18

Dialog                                   ui/dialog.tsx (Radix)
  layout    celular: folha que sobe de baixo, largura total; desktop: centralizado, máx. 512px
  a11y      foco preso, Esc fecha, título obrigatório, botão Fechar com aria-label
  used on   cancelar OS, atribuir técnico, editar itens, confirmações

Toast                                    ui/toast.tsx (sonner)
  tones     success, error, info; topo central; botão fechar
  used on   salvar, concluir, erros de rede

SyncIndicator                            ui/sync-indicator.tsx
  states    online (sincronizado), offline (+ pendências), syncing (n), error (n)
  used on   cabeçalho do app (M01–M08)

Sidebar                                  app-shell.tsx
  tokens    sidebar, on-sidebar, on-sidebar-muted, sidebar-active; largura 240px
  a11y      <nav aria-label>, aria-current na página atual
  used on   todas as telas web (S02–S21)

BottomNav                                app-shell.tsx
  items     Minhas OS, Ler QR, Chamado, Avisos; ícone 24px + rótulo; altura 64px + safe area do iPhone
  used on   app (M01–M08)

ChecklistItem                            checklist-item.tsx
  kinds     text, number, reading (faixa mín/máx + unidade), photo, choice, yes_no
  states    vazio, preenchido, fora da faixa (borda + ícone + "Fora da faixa"), faltando (borda danger
            + "Obrigatório para concluir a OS"), crítico (selo)
  input     número com teclado decimal, aceita vírgula; sim/não e seleção como botões grandes (radiogroup)
  photo     <input capture="environment">: abre a câmera traseira no Android e no iPhone
  used on   M04, S13 (leitura), S08 (prévia)

SignatureField                           signature-field.tsx (signature_pad)
  states    em branco, assinado, limpar
  notes     canvas nítido em tela retina; refaz no redimensionamento; devolve PNG
  a11y      role=img com rótulo que diz se está em branco ou assinado
  used on   M05, S13
```

## Ainda faltam (entram com as telas no /replica-build)

- **Barra de filtros** (S02, S04, S12, S18, S19): chips de filtros ativos + Select/DateRange.
- **Calendário** (S11) e **Kanban** (S12, could): FullCalendar ou um calendário próprio; decidir no build.
- **Árvore de locais** (S03).
- **Leitor de QR** (M02): `@zxing/browser`, com entrada manual da tag quando a câmera é negada.
- **Etiqueta QR** (S07): PDF para impressão.
- **Linha do tempo** (S13, S05).
- **Gráficos** (S02, S19): Recharts com os tokens; o skill `dataviz` define as cores das séries.
