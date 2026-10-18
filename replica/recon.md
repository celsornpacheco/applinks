# Recon map: Leankeep – Controle de Manutenção (web desktop + app mobile)

Escopo: o ciclo central de manutenção de ativos. Cadastro de unidades, áreas e
equipamentos (com QR Code); planos preventivos com checklists e periodicidade
que geram OS automaticamente; abertura e execução de corretivas (chamados);
app de campo offline para consulta e coleta (checklist, leituras, fotos,
assinatura); histórico por ativo; dashboard, indicadores (MTTR, MTBF, SLA) e
relatórios PDF/Excel. Solicitação de material ao almoxarifado como "should".
Para: uso interno da **Inovapet Embalagens** (uma empresa, uma ou poucas
plantas). Não é um produto para vender, então multi-cliente, cobrança e
white-label ficam fora.
Data: 2026-10-18

## Como esta recon foi feita (leia antes)

- **Só fontes públicas.** Nenhum login, nenhuma conta do Leankeep, nenhum código
  ou API privada.
- **A rede deste ambiente bloqueia** leankeep.com, a central de ajuda e o
  YouTube. As páginas foram lidas pelo índice de busca (trechos e resumos), e
  não abertas diretamente. **Os vídeos do canal não puderam ser assistidos**:
  só os títulos e as descrições das playlists foram lidos.
- Por isso **não há capturas de tela em `replica/screens/`**, e as telas abaixo
  vêm das descrições de funcionalidade, não da observação da interface. A
  coluna "estados" diz o que foi *descrito*, não o que foi *visto*.
- Para fechar as lacunas: assista às playlists listadas em Fontes (nº 14–16) e
  salve 1 print por tela em `replica/screens/S01.png` etc. Isso vai servir de
  referência de layout para o `/replica-design` e o `/replica-diff`.

## Fontes

| # | fonte | URL | notas |
| --- | --- | --- | --- |
| 1 | site: home | https://leankeep.com/ | posicionamento: CMMS web + app para O&M e facilities; integração com BI |
| 2 | site: preventivas | https://leankeep.com/preventivas | unidades → áreas → equipamentos, QR Code, responsáveis, MTBF/MTTR por unidade e equipamento, horas previstas × consumidas |
| 3 | site: planejar preventivas | https://leankeep.com/planejar-preventivas | planos com periodicidade diária/semanal/mensal/anual, itens obrigatórios, critérios de aceite, gatilhos para achados críticos, OS gerada automaticamente, calendário por equipe |
| 4 | site: corretivas | https://leankeep.com/corretivas | chamado pelo portal, pela equipe interna ou por QR Code; SLA por categoria e criticidade com alerta de estouro; tempo de resposta, tempo de atendimento, MTTR, taxa de reabertura; encerramento com evidências |
| 5 | site: aplicativo | https://leankeep.com/aplicativo | offline com sincronização automática; OS do dia; checklist com campos obrigatórios (texto, número, leitura, foto, seleção); bloqueio de encerramento sem evidência crítica; assinatura; QR abre histórico, plano e OS; o técnico vê só as próprias OS e áreas |
| 6 | site: relatórios | https://leankeep.com/relatorios | PDF/Excel a partir das OS com evidências; filtros por período, unidade e equipe; calendário de atividades + horas técnicas; importação de planilha em massa; modelos por segmento |
| 7 | site: PMOC | https://leankeep.com/pmoc | PMOC digital (ar-condicionado, Lei 13.589): plano, leituras obrigatórias, assinatura do técnico/RT |
| 8 | site: FAQ | https://leankeep.com/faq | definição de usuário; registro de problema com local e prioridade; MTBF/MTTR dependem da configuração |
| 9 | página de planos | https://pages.leankeep.com/planos-leankeep/ | a partir de R$297/mês para 3 usuários, cobrança por usuário em faixas; solicitante não conta como usuário; locais e equipamentos ilimitados (mostra o que importa) |
| 10 | central de atualizações | https://leankeep.com/central-de-atualizacoes/ | nova Home em painel, filtros globais, relatório de horas técnicas, report semanal às segundas, Power BI, novo Portal do Cliente, relatório de ativos, tela de documentos, edição de imagem no app, modo online/sincronizado |
| 11 | nova Home | https://leankeep.com/nova-home-sua-operacao-em-um-so-painel/ | ocorrências pendentes × solucionadas, chamados por prioridade, status das atividades previstas; filtros por período, sistema, unidade, estado/cidade |
| 12 | relatório de ativos | https://leankeep.com/novo-relatorio-de-ativos-no-leankeep/ | escolhe a unidade e os filtros, inclui fotos e cronograma, entrega por e-mail |
| 13 | documentos | https://leankeep.com/controle-de-materiais-e-documentos-das-edificacoes/ | manuais, plantas e garantias vinculados a ambiente, sistema ou equipamento |
| 14 | YouTube: canal | https://www.youtube.com/@leankeepsoftware | não foi possível assistir daqui |
| 15 | YouTube: Tutoriais para Usuário Chamado | https://www.youtube.com/playlist?list=PLXtIpr8WQw-wMwyqZ7Slz_nsHFirF_Inx | abrir, acompanhar e avaliar chamados pela web e pelo app |
| 16 | YouTube: Portal do Cliente | https://www.youtube.com/playlist?list=PLXtIpr8WQw-ySLFX72_X1IS_3L0BwKTG0 | passo a passo do portal |
| 17 | App Store | https://apps.apple.com/br/app/leankeep/id1407838906 | app para técnicos e solicitantes: atividades planejadas, chamados, corretivas; nota 4,3 com 106 avaliações |
| 18 | Google Play | https://play.google.com/store/apps/details?id=com.leankeep.leankeepv4 | funciona sem internet; v5.12.808: solicitação de material a partir da ocorrência, com notificação |
| 19 | central de ajuda | https://suporte.leankeep.com/hc/pt-br/articles/203107955 · https://leankeep.movidesk.com/kb | "Atividades por Aplicação", "Sobre Sistemas", "Sobre Usuários", usuário operacional, ocorrência por QR, API de ocorrências |
| 20 | avaliações (Capterra) | https://www.capterra.com/p/216786/Leankeep-Hotel/reviews/ | OS fácil, vários técnicos por OS; queixas: bugs, sem notificação push, sem controle de e-mail, relatório diário lento (para o `/replica-entrepreneur`) |
| 21 | artigo de terceiro (antigo) | https://www.webarcondicionado.com.br/leankeep-software-de-manutencao-predial-auxilia-na-elaboracao-do-pmoc | kanban, agendas, anomalias e ações corretivas. Antigo, use com cautela |

## Ciclo central

O gestor cadastra os equipamentos e os planos; o sistema gera as OS no
calendário; o técnico executa no celular, mesmo offline, com checklist, fotos,
leituras e assinatura; quebras viram chamados corretivos com SLA; tudo vai para
o histórico do ativo e para os indicadores.

## Adaptação para a Inovapet Embalagens

O Leankeep foi feito para prédios e facilities (sistemas como ar-condicionado,
hidráulica e elétrica). Uma fábrica de embalagens tem os mesmos conceitos com
outros nomes. O clone mantém o modelo e troca os termos e os modelos de
checklist:

| Leankeep | Inovapet (sugerido) | exemplos |
| --- | --- | --- |
| Unidade | Planta / unidade | Fábrica 1 |
| Área / ambiente | Setor / linha | Injeção, Sopro, Extrusão, Utilidades, Expedição |
| Sistema | Sistema / tipo de equipamento | Hidráulico, Pneumático, Elétrico, Refrigeração, Moldes |
| Equipamento | Equipamento / ativo | Injetora 03, Sopradora PET 02, Compressor parafuso, Chiller, Torre de resfriamento, Molde 24 cav. |
| Solicitante (chamado) | Operador / líder de produção | abre o chamado pelo QR Code da máquina |
| PMOC | só se houver ar-condicionado sujeito à lei | escritório, sala limpa |

Coisas de fábrica que o Leankeep não destaca e que valem como "could":
horímetro ou contador de ciclos como gatilho de preventiva, e registro de
máquina parada (downtime) para o MTBF ficar real.

## Telas

Web desktop = W, app mobile = M. Rotas propostas, não as do original.

| ID | tela | rota / como chegar | finalidade | componentes principais | estados descritos |
| --- | --- | --- | --- | --- | --- |
| S01 | Login | /login · M: abertura | entrar (e-mail e senha) | form, botão | erro de credencial, offline (M: só com sessão salva) |
| S02 | Home / painel | /  | visão da operação | cards de KPI, gráficos (pendentes × solucionadas, por prioridade, status das previstas), filtros globais (período, sistema, unidade) | vazio (sem dados), carregado |
| S03 | Unidades, áreas e sistemas | /config/locais | montar a hierarquia | árvore, form em modal | vazio, com itens |
| S04 | Lista de equipamentos | /ativos | inventário | tabela, busca, filtros (unidade, área, sistema, criticidade), importar planilha | vazio, filtrado sem resultado, carregado |
| S05 | Ficha do equipamento | /ativos/:id | dados, QR, plano, histórico, documentos | abas (Dados, Planos, Histórico de OS, Documentos, Indicadores), botão imprimir QR | sem histórico, com histórico |
| S06 | Cadastro/edição de equipamento | /ativos/novo · /ativos/:id/editar | criar ou editar ativo | form (tag, nome, fabricante, modelo, série, local, sistema, criticidade, foto, responsável) | validação, salvo |
| S07 | Etiquetas QR | /ativos/qr | imprimir etiquetas em lote | grade de etiquetas, seleção, imprimir | — |
| S08 | Modelos de checklist | /checklists | itens reutilizáveis por tipo de equipamento | lista, editor de itens (texto, número, leitura com faixa, foto, seleção, sim/não), obrigatório, crítico | vazio, com itens |
| S09 | Planos de manutenção | /planos | preventivas | tabela de planos: equipamento(s), checklist, periodicidade, responsável/equipe, próxima data | vazio, ativo, pausado |
| S10 | Editor de plano | /planos/:id | definir o plano | form: alvo (equipamento, área ou sistema), checklist, periodicidade (dias/semanas/meses/anos), início, horas previstas, equipe; prévia das próximas datas | validação |
| S11 | Calendário de atividades | /calendario | ver e redistribuir as OS previstas | calendário mês/semana, filtro por equipe/técnico, arrastar para remarcar | vazio, carregado, atrasadas destacadas |
| S12 | Lista de OS / ocorrências | /os | acompanhar toda a operação | tabela ou kanban (Aberta, Em andamento, Aguardando material, Concluída, Cancelada), filtros (tipo preventiva/corretiva, status, prioridade, técnico, período, atraso de SLA) | vazio, carregado, SLA estourando |
| S13 | Detalhe da OS | /os/:id | ver e gerir uma OS | cabeçalho (ativo, tipo, prioridade, SLA), técnicos, checklist respondido, fotos, leituras, assinatura, materiais, horas, linha do tempo, reabrir, avaliar | aberta, em execução, concluída, reaberta |
| S14 | Abrir chamado (corretiva) | /os/nova · M · portal via QR | registrar um problema | form: ativo/local, descrição, prioridade, categoria, foto | enviado, validação |
| S15 | Portal do solicitante | /portal (ou /q/:qr) | o operador abre e acompanha os chamados dele sem licença | form simples, lista "meus chamados", avaliação | vazio, com chamados |
| S16 | Solicitações de material | /materiais | pedidos ao almoxarifado ligados a OS | tabela, status (solicitado, aprovado, entregue, negado) | vazio, carregado |
| S17 | Documentos | /documentos | manuais, plantas, garantias | lista, upload, vínculo a ativo/área/sistema, validade | vazio, carregado |
| S18 | Relatórios | /relatorios | PDF/Excel | seletor de relatório (OS, preventivas, calendário, ativos, horas técnicas, SLA, PMOC), filtros, exportar | gerando, pronto |
| S19 | Indicadores | /indicadores | MTTR, MTBF, SLA, aderência ao plano, reabertura, horas previstas × consumidas | gráficos por ativo/setor/período | dados insuficientes, carregado |
| S20 | Usuários e equipes | /config/usuarios | perfis e acesso | tabela, convite, perfil (admin, gestor, técnico, solicitante), equipe, áreas permitidas | — |
| S21 | Configurações | /config | categorias, prioridades, regras de SLA, campos do chamado, notificações, report semanal | forms | — |
| M01 | App: minhas OS (hoje) | aba inicial | o que o técnico tem hoje | lista agrupada (hoje, atrasadas, próximas), indicador de sync | vazio, offline, pendente de sync |
| M02 | App: leitor de QR | botão central | achar o ativo | câmera, entrada manual da tag | sem permissão de câmera, QR desconhecido |
| M03 | App: ficha do ativo | após o QR | consulta em campo | dados, plano, últimas OS, documentos, botões "abrir chamado" e "iniciar OS" | offline (cache) |
| M04 | App: executar OS | toque na OS | coletar dados | passo a passo do checklist, campos por tipo, foto (com edição), leitura fora da faixa = alerta, observações, materiais, horas | item obrigatório faltando, bloqueado |
| M05 | App: encerrar com assinatura | fim do checklist | provar a execução | resumo, assinatura (técnico e responsável), concluir | bloqueado por evidência crítica faltando |
| M06 | App: abrir chamado | M03 ou menu | corretiva em campo | form curto + foto | enviado offline (na fila) |
| M07 | App: solicitar material | dentro da OS | pedir peça | busca de material, quantidade | — |
| M08 | App: sincronização | ícone de status | ver a fila e forçar o envio | lista de pendências, conflitos | erro de sync, conflito |

## Fluxos

```
F01 Gestor cadastra o parque de equipamentos
    S03 hierarquia -> S04 lista -> S06 novo equipamento (ou importar planilha) -> S05 ficha -> S07 imprimir QR
    happy path cliques: ~8 por equipamento (import em lote: 4 no total)
    edge: tag duplicada, planilha com colunas erradas, equipamento movido de setor (manter o histórico)

F02 Gestor cria um plano preventivo
    S08 checklist -> S09 planos -> S10 editor (alvo, checklist, periodicidade, equipe) -> prévia -> salvar -> S11 calendário com OS geradas
    happy path cliques: ~10
    edge: plano para vários equipamentos de uma vez, mudar a periodicidade com OS futuras já geradas,
          feriados/fim de semana, pausar o plano com a máquina parada

F03 Técnico executa a preventiva do dia no celular (offline)
    M01 minhas OS -> M04 executar checklist (leituras, fotos) -> M05 assinatura -> concluir -> M08 sync quando voltar a rede
    happy path cliques: 3 + 1 por item do checklist
    edge: sem rede o tempo todo, leitura fora da faixa (gera corretiva?), item obrigatório vazio bloqueia,
          dois técnicos na mesma OS, OS editada na web enquanto o técnico está offline (conflito)

F04 Operador abre um chamado pelo QR da máquina
    M02/QR -> S15 portal ou M06 -> descrição + foto + prioridade -> enviado -> notificação ao gestor
    happy path cliques: 4
    edge: QR de ativo desativado, chamado duplicado na mesma máquina, operador sem conta (portal público com código?)

F05 Gestor faz a triagem e despacha a corretiva
    S12 lista (filtro "abertas") -> S13 detalhe -> atribuir técnico(s), prioridade, SLA -> técnico recebe em M01
    happy path cliques: 4
    edge: SLA perto de estourar (alerta), reatribuição, cancelar com motivo

F06 Técnico atende a corretiva e pede material
    M01 -> M04 diagnóstico/fotos -> M07 solicitar peça -> status "aguardando material" -> material entregue -> concluir M05
    happy path cliques: ~8
    edge: material negado, OS parada por dias (o relógio do SLA para?)

F07 Solicitante acompanha e avalia
    S15 meus chamados -> chamado concluído -> avaliação (nota + comentário) -> reabrir se não resolveu
    happy path cliques: 3
    edge: reabertura conta para a taxa de reabertura

F08 Consultar o histórico de um ativo em campo
    M02 QR -> M03 ficha (últimas OS, plano, manual)
    happy path cliques: 2
    edge: offline, só com o cache da ficha

F09 Gestor acompanha os indicadores e exporta relatórios
    S02 painel -> S19 indicadores (MTTR/MTBF por máquina) -> S18 relatório OS do mês -> PDF/Excel
    happy path cliques: 5
    edge: período sem dados, relatório grande (o original é lento aqui, segundo as avaliações)

F10 Administrador configura usuários, equipes e SLA
    S20 convidar usuário, perfil, equipe, setores -> S21 categorias, prioridades, SLA, notificações
    happy path cliques: ~6
    edge: técnico desligado com OS abertas, técnico vendo só os setores dele
```

## Componentes

| componente | variantes | estados | usado em |
| --- | --- | --- | --- |
| Botão | primário, secundário, fantasma, perigo, ícone | padrão, hover, foco, desabilitado, carregando | todas |
| Campo de formulário | texto, número, data, select, multi-select, textarea, upload | padrão, foco, erro, desabilitado | S06, S10, S14, S21 |
| Tabela de dados | com seleção, ordenação, paginação, ações por linha | vazia, carregando, filtrada sem resultado | S04, S09, S12, S16, S17, S20 |
| Barra de filtros | global (período, unidade, sistema) e da página | com filtros ativos (chips) | S02, S04, S12, S18, S19 |
| Árvore de locais | expansível, arrastar | vazia, com itens | S03, seletor de local |
| Badge de status | aberta, em andamento, aguardando, concluída, cancelada, atrasada | — | S12, S13, M01 |
| Badge de prioridade/criticidade | baixa, média, alta, urgente | — | S04, S12, S13 |
| Indicador de SLA | no prazo, em risco, estourado | contagem regressiva | S12, S13 |
| Cartão de KPI | número + variação | carregando | S02, S19 |
| Gráfico | barras, rosca, linha | sem dados | S02, S19 |
| Calendário | mês, semana, lista | arrastar, atrasada | S11 |
| Kanban | colunas por status | arrastar | S12 |
| Item de checklist | texto, número, leitura (mín/máx), foto, seleção, sim/não; obrigatório; crítico | vazio, preenchido, fora da faixa, faltando | S08, S13, M04 |
| Captura de foto | câmera, galeria, anotar/editar | enviando, falhou (fila) | M04, M06, S14 |
| Pad de assinatura | técnico, responsável | vazio, assinado, limpar | M05, S13 |
| Leitor de QR | câmera, entrada manual | sem permissão, não encontrado | M02 |
| Etiqueta QR | tamanhos de impressão | — | S07 |
| Linha do tempo | eventos da OS | — | S13, S05 |
| Modal / drawer | form, confirmação | — | todas |
| Toast | sucesso, erro, info | — | todas |
| Indicador de sync (M) | online, offline, pendente (n), erro | — | M01, M08 |
| Navegação | sidebar (W), abas inferiores (M) | ativo | todas |

## Modelo de dados inferido

```
Unidade (Site)    id, nome, endereço, cidade, uf
                  evidência: fonte 2 (unidades), 11 (filtro por estado/cidade)   confiança: alta

Area              id, unidade_id, area_pai_id (opcional), nome
                  evidência: fonte 2 (unidades → áreas → equipamentos)          confiança: alta

Sistema           id, nome (ar-condicionado, elétrico... / Inovapet: hidráulico, pneumático, moldes)
                  evidência: fontes 11, 17, 19 ("Sobre Sistemas")               confiança: alta

Equipamento       id, area_id, sistema_id, tag, nome, fabricante, modelo, nº série,
                  criticidade, status (ativo | inativo), foto, responsável_id, qr_token, dados_extra (json)
                  evidência: fontes 2, 5, 6, 12                                 confiança: alta (campos exatos: palpite)

ModeloChecklist   id, nome, sistema_id (opcional)
ItemChecklist     id, modelo_id, ordem, texto, tipo (texto | numero | leitura | foto | selecao | sim_nao),
                  opcoes (json), min, max, unidade_medida, obrigatorio, critico
                  evidência: fontes 3, 5                                        confiança: alta

PlanoManutencao   id, nome, alvo (equipamento | area | sistema), alvo_id(s), modelo_checklist_id,
                  periodicidade (n + dias | semanas | meses | anos), inicio_em, horas_previstas,
                  equipe_id / responsavel_id, ativo
                  evidência: fontes 3, 2 (horas previstas × consumidas)          confiança: alta

OrdemServico (OS) id, numero, tipo (preventiva | corretiva), equipamento_id, area_id, plano_id (preventiva),
                  titulo, descricao, prioridade, categoria, status
                  (aberta | atribuida | em_andamento | aguardando_material | concluida | cancelada | reaberta),
                  previsto_para, sla_resposta_ate, sla_solucao_ate,
                  aberta_em, primeira_acao_em, chegada_em, iniciada_em, concluida_em,
                  aberta_por_id, origem (web | app | portal | qr | plano), avaliacao_nota, avaliacao_comentario
                  evidência: fontes 4 (tempos de resposta e atendimento, origem), 5, 15  confiança: alta (status exatos: palpite)

OSTecnico         os_id, usuario_id                       evidência: fonte 20 (vários técnicos por OS)   confiança: alta
RespostaChecklist os_id, item_id, valor, fora_da_faixa, foto_id    evidência: fonte 5    confiança: alta
Anexo             id, os_id | equipamento_id, tipo (foto | arquivo), url, anotado   evidência: fontes 5, 10   confiança: alta
Assinatura        os_id, papel (tecnico | responsavel), nome, imagem, assinada_em   evidência: fontes 5, 7    confiança: alta
Apontamento       os_id, usuario_id, inicio, fim (horas técnicas)    evidência: fonte 10 (relatório de horas)   confiança: média
EventoOS          os_id, usuario_id, tipo, de, para, em (linha do tempo, reabertura)   confiança: palpite

Material          id, codigo, nome, unidade                       evidência: fonte 18     confiança: média
SolicitacaoMaterial id, os_id, material_id, quantidade, status (solicitado | aprovado | entregue | negado),
                  solicitado_por_id                               evidência: fonte 18     confiança: média
                  (estoque e almoxarifado completo: não há evidência de que o original tenha)

Documento         id, vinculo (equipamento | area | sistema), vinculo_id, nome, tipo (manual | planta | garantia),
                  arquivo, validade                               evidência: fontes 10, 13   confiança: média

RegraSLA          id, categoria, prioridade, horas_resposta, horas_solucao   evidência: fonte 4   confiança: média
Categoria         id, nome            Prioridade (enum ou tabela)          confiança: média

Usuario           id, nome, email, perfil (admin | gestor | tecnico | solicitante), equipe_id, ativo
UsuarioArea       usuario_id, area_id (o técnico vê só as áreas dele)
Equipe            id, nome
                  evidência: fontes 5, 8, 9, 19                    confiança: alta (perfis exatos: média)

Notificacao       id, usuario_id, tipo, os_id, lida, criada_em    evidência: fontes 4, 18   confiança: média
```

Relacionamentos: Unidade 1-n Area, Area 1-n Area (sub-área), Area 1-n Equipamento,
Sistema 1-n Equipamento, ModeloChecklist 1-n ItemChecklist, PlanoManutencao n-1
ModeloChecklist, PlanoManutencao 1-n OS, Equipamento 1-n OS, OS n-n Usuario
(técnicos), OS 1-n RespostaChecklist/Anexo/Assinatura/Apontamento/SolicitacaoMaterial,
Equipamento 1-n Documento.

Indicadores (calculados, não armazenados):
- **MTTR** = média de (concluida_em − aberta_em) das corretivas, por equipamento.
- **MTBF** = tempo de operação ÷ nº de falhas (corretivas) no período, por
  equipamento. Sem registro de parada, use o intervalo entre corretivas. O
  FAQ diz que depende da configuração (fonte 8).
- **SLA** = % de OS dentro de `sla_resposta_ate` / `sla_solucao_ate`.
- **Aderência ao plano** = preventivas concluídas no prazo ÷ previstas.
- **Taxa de reabertura**, **horas previstas × consumidas**.

## Matriz de funcionalidades

Ver `features.csv`. Must: 43, should: 18, could: 12, skip: 6 (79 linhas).

## Fora do escopo (não pode ou não deve ser clonado)

- **Marca, logo, textos e modelos de checklist prontos do Leankeep.** O clone
  ganha nome e identidade próprios (`/replica-brand`), e os checklists da
  Inovapet são escritos pela sua equipe para as suas máquinas.
- **Modelos PMOC e laudos com responsável técnico (RT).** A conformidade legal
  é sua e do seu RT. O clone guarda as evidências, não as certifica.
- **Gestão multi-cliente** (empresas de facilities atendendo vários prédios),
  cobrança por usuário e planos: a Inovapet usa internamente.
- **A API de ocorrências e a integração "oficial" com Power BI.** Clona-se a
  função (exportar dados para BI via Excel/CSV ou um endpoint próprio), não a
  integração deles.
- **Página dedicada, programa de indicação, report semanal de marketing**:
  coisas do negócio do Leankeep, não da manutenção.

## Tamanho

Telas: 21 web + 8 mobile = 29. Fluxos: 10. Entidades: ~22.

Partes difíceis:
1. **App offline com sincronização** (fila local, upload de fotos depois,
   conflito quando a OS muda na web). É a parte mais cara. Para cortar
   custo, o `/replica-architect` deve avaliar um PWA offline em vez de um app
   nativo.
2. **Motor de geração de preventivas** (periodicidade, remarcação, mudança de
   plano com OS futuras, pausa) e **relógio de SLA**.
3. **Relatórios PDF/Excel com fotos e assinaturas** e indicadores corretos
   (MTBF real exige registro de parada).

Tamanho: **L** (um trimestre) para tudo que é must + should, com uma pessoa
desenvolvendo com o Claude. Só os must, com o app como PWA: **M alto** (6–8
semanas). Não há promessa de clone perfeito; o `/replica-diff` dá o número
real.
