# Deploy: Inovapet Manutenção (piloto)

Data: 2026-10-18. Tipo: **piloto interno**, para testar na fábrica enquanto as entregas 2 e 3 são construídas.
Não é o lançamento final: o gate de paridade ainda reprova (19 de 43 essenciais), de propósito.

## Preflight

| checagem | resultado |
| --- | --- |
| testes de ponta a ponta (`npm run e2e`, Supabase local) | 5 de 5 passando |
| build de produção (`npm run build`) | passa |
| lint (`npx eslint`) | limpo |
| varredura de marca (`sweep.py web --avoid Leankeep --domains leankeep.com…`) | limpa |
| paridade (`parity.py replica/features.csv`) | 45,1; 19 de 43 essenciais. **Aceito para piloto** |
| bugs S1/S2 abertos | nenhum conhecido |
| página de privacidade | `/privacidade`, lista Supabase e Vercel |
| cookies | só o de sessão (essencial): sem banner |
| ícones, títulos | próprios (provisórios até o /replica-brand) |
| checagens de segurança do Supabase | só os 4 avisos intencionais (funções das regras de acesso) |
| lojas de apps | não se aplica (PWA) |

## Produção

| item | situação |
| --- | --- |
| Supabase | projeto `inovapet-manutencao` (`umuqchegcgpowivngudp`, us-east-1), migrações 01–10 aplicadas, cadastro inicial carregado |
| Storage | buckets privados `evidencias` e `assinaturas` com regras por OS |
| Agendamentos | `sla-15min` (a cada 15 min), `preventivas-diarias` (03:00 Brasília) |
| Backup | **plano gratuito não tem backup automático**: passar para o Pro antes de ter dados reais que não podem ser perdidos |
| Cadastro público | **desligar** em Authentication → Sign In / Providers → "Allow new users to sign up" |
| Hospedagem | Vercel, raiz `web/`, branch `claude/replica-skill-iw5ajm` |
| Domínio | `*.vercel.app` por enquanto; domínio próprio é opcional (registros abaixo) |
| Pendente | rodar no SQL Editor a função `reschedule_plan` (contém `delete`, precisa da sua confirmação). Só necessária na entrega 2 |

### Variáveis de ambiente (Vercel → Settings → Environment Variables)

| nome | valor | onde pegar |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://umuqchegcgpowivngudp.supabase.co` | — |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | Supabase → Project Settings → API Keys |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` (a **nova**, depois de trocar a que vazou) | idem, "Secret keys". Cola direto na Vercel |
| `NEXT_PUBLIC_SITE_URL` | o endereço do site, ex. `https://inovapet-manutencao.vercel.app` | depois do primeiro deploy |

### Domínio próprio (opcional, ex.: `manutencao.inovapet.com.br`)

| registro | nome | valor |
| --- | --- | --- |
| CNAME | `manutencao` | o valor que a Vercel mostrar em Settings → Domains (normalmente `cname.vercel-dns.com`) |

Depois de trocar o domínio, atualizar `NEXT_PUBLIC_SITE_URL` e o Site URL do Supabase, e **reimprimir as etiquetas QR** (o QR guarda o endereço).

## Primeira semana

- Logs: Vercel → Logs (erros 500) e Supabase → Logs (Auth e API).
- Conferir em Supabase → Database → Cron que `sla-15min` roda sem erro.
- Testar no celular: instalar pelo passo a passo em `/app/instalar`, ler uma etiqueta, abrir chamado com foto, concluir com assinatura.
- Anotar tudo que ficar estranho e mandar: vira a lista de correções antes da entrega 2.
