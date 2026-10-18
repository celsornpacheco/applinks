# Diário de construção

| tela | data | situação | o que falta | o que foi mais difícil |
| --- | --- | --- | --- | --- |
| infra | 2026-10-18 | feito | — | Rede bloqueia o Supabase e o Docker não baixa imagens: montado um Supabase local sem Docker (`dev/local-supabase/`: Postgres + PostgREST + Supabase Auth + storage simples) para testar tudo com login e RLS de verdade |
| S01 Login | 2026-10-18 | feito | recuperar senha (sem e-mail configurado) | redirecionar para `/q/...` depois do login: resolvido no servidor |
| S02 Painel | 2026-10-18 | parcial | gráficos e filtros (entrega 3) | — |
| S03 Setores e sistemas | 2026-10-18 | parcial | sub-áreas, editar e desativar | — |
| S04 Lista de equipamentos | 2026-10-18 | feito | importar planilha (should) | — |
| S05 Ficha do equipamento | 2026-10-18 | feito | foto do equipamento, documentos | — |
| S06 Cadastro de equipamento | 2026-10-18 | parcial | foto | — |
| S07 Etiquetas QR | 2026-10-18 | feito | — | — |
| S12 Lista de OS | 2026-10-18 | parcial | filtro por técnico e período | — |
| S13 Detalhe da OS | 2026-10-18 | parcial | checklist (entrega 2) | — |
| S20 Usuários | 2026-10-18 | parcial | equipes, áreas do técnico | — |
| S21 Configurações | 2026-10-18 | parcial | categorias, prioridades, SLA e campos do chamado | — |
| M01 Minhas OS | 2026-10-18 | feito | — | ordenar por prioridade no app (o banco ordenaria o texto em ordem alfabética) |
| M02 Leitor de QR | 2026-10-18 | feito | testar em iPhone e Android reais | leitor nativo não existe no iPhone: ZXing |
| M03 Ficha no app | 2026-10-18 | parcial | plano e documentos | — |
| M04/M05 Executar e assinar | 2026-10-18 | parcial | checklist (entrega 2), offline (entrega 3) | — |
| M06 Abrir chamado | 2026-10-18 | feito | — | — |
| Avisos | 2026-10-18 | parcial | contador e atualização ao vivo | — |

## Bugs encontrados pelo teste de ponta a ponta (corrigidos)

- **Todo chamado novo seria recusado** em produção: ao fechar as permissões das funções, o gatilho que calcula o SLA ficou sem acesso a `find_sla()`. Corrigido no banco (migração 07).
- Mensagem de bloqueio dizia "OS 5", agora "OS #5" (migração 08).
- Leitor de QR navegava para `/q/` sem recarregar a página: trocado por navegação completa.
