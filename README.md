# OpenClaw Dashboard

Painel multi-tenant para orquestrar agentes OpenClaw: clientes, agentes,
skills, crons, GitHub, custos e auditoria — com toggle de role admin/cliente
na mesma conta.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + componentes inline (estilo shadcn)
- Auth.js v5 (Credentials + JWT)
- Prisma + SQLite (fácil de migrar para Postgres depois)

## Setup inicial

```bash
npm install
npx prisma db push       # cria prisma/dev.db
npm run db:seed          # tenants, usuário, agentes, skills, crons, custos
npm run dev              # http://localhost:3100
```

### Conta seed

- **Email:** `lucas.odantas@gmail.com`
- **Senha:** `changeme`
- **Papéis:** `admin` + `cliente` (tenant `dantas-labs`)
- O toggle **Admin / Cliente** aparece no header.

## Guia de teste rápido

### 1. Login e troca de role

1. Acesse `/login` e entre com os seeds acima.
2. Note o toggle no header — clique em **Cliente** → você vê só `dantas-labs`.
3. Volte para **Admin** → vê todos os tenants, agentes e custos.

### 2. Admin panel

| Rota | O que testar |
|------|--------------|
| `/admin` | Visão geral, agentes recentes com status efetivo |
| `/admin/tenants` | Lista + **Novo cliente** → cria, edita, limite de custo |
| `/admin/agents/lucas-ops-01` | Todas as seções: persona, heartbeat, GitHub, skills, crons, custo |
| `/admin/github` | Integrações consolidadas |
| `/admin/skills` | Catálogo agrupado por categoria, CRUD |
| `/admin/crons` | Todas as tarefas agendadas com estado |
| `/admin/costs` | Totais hoje/semana/mês, top tenants e agentes, barras de uso vs limite |
| `/admin/users` | Criar usuário, promover admin, vincular tenants, redefinir senha |
| `/admin/invites` | Gerar link mágico e revogar |
| `/admin/audit` | Log completo de mutações |

### 3. Dark mode e atalhos visuais

- Botão sol/lua no header alterna tema.
- Pills de status: `online`, `sem heartbeat`, `offline`, `degraded`.

### 4. Fluxo do cliente

- Toggle para **Cliente** no header.
- `/client` mostra apenas tenants e agentes do Lucas.
- `/client/agents/lucas-ops-01` permite gerenciar heartbeat, GitHub, skills,
  crons e limite próprio — sem ver nada de Acme/Initech.

### 5. Heartbeat real

Na página do agente em **admin**, revele o secret (botão olho) e copie. Depois:

```bash
curl -X POST http://localhost:3100/api/agents/lucas-ops-01/heartbeat \
  -H "Authorization: Bearer <secret>" \
  -H "Content-Type: application/json" \
  -d '{"version":"1.2.3","status":"online"}'
```

A página do agente passa a mostrar **online** com a versão reportada.
Se parar de bater, fica **sem heartbeat** (>2 min) ou **offline** (>10 min).

Para integração permanente (o agente mantendo o status vivo sozinho),
veja a seção [Conectando seus agentes](#-conectando-seus-agentes-nodejs)
abaixo.

### 6. Limites de custo

Acme Corp já vem com orçamento mensal `$100` seedado. Entre em
`/admin/tenants/acme` — a barra mostra o uso. Veja também `/admin/costs`:
barras ficam verdes, amarelas (80%+) ou vermelhas (>100%).

### 7. Convite por link mágico

1. `/admin/invites/new` → crie um convite para `teste@empresa.com`, vinculado
   ao tenant `acme`.
2. Na lista, clique em **Copiar link**.
3. Abra o link em janela anônima → defina nome + senha → você entra como
   cliente da Acme automaticamente.

### 8. Auditoria

Tudo acima aparece em `/admin/audit` com ator, ação, entidade e diff em JSON.

## 🔌 Conectando seus agentes (Node.js)

> Para cada agente que você quer ver no painel, o código do agente precisa
> bater no endpoint de heartbeat. Sem isso o painel não tem como saber se ele
> está vivo — nem `pm2 status` resolveria, pois o processo pode estar de pé
> mas o agente travado. **Status no painel = heartbeat do OpenClaw.**

### Passo 1 — Cadastrar o agente no painel

1. Faça login como admin.
2. Vá em `/admin/agents/new` (ou toggle para **Cliente** → **Meus agentes** →
   **Novo agente** se for você mesmo o cliente).
3. Preencha:
   - **Nome amigável** (ex: "Suporte Telegram")
   - **agentId** único: minúsculo, com hífens (ex: `lucas-tg-suporte-01`)
   - **Cliente** (tenant a que o agente pertence)
   - **Modelo LLM** (ex: `claude-sonnet-4-6`)
4. Clique em **Criar agente**.

### Passo 2 — Copiar o secret

Na página de detalhe do agente recém-criado, role até a seção
**Integração · Heartbeat**:

1. Clique no ícone 👁 para **revelar** o secret (começa com `ocs_…`).
2. Clique no ícone 📋 para **copiar**.
3. Anote em lugar seguro a dupla `agentId` + `secret`.

Se em algum momento você suspeitar que o secret vazou, use o ícone 🔄 na mesma
tela para **rotacionar** — isso invalida o antigo.

### Passo 3 — Baixar o módulo de heartbeat

O repositório traz duas versões prontas em `examples/`:

| Arquivo | Quando usar |
|---------|-------------|
| [`examples/openclaw-heartbeat.js`](examples/openclaw-heartbeat.js) | Projetos CommonJS (usam `require`) |
| [`examples/openclaw-heartbeat.mjs`](examples/openclaw-heartbeat.mjs) | Projetos ESM (`"type": "module"` no `package.json`) |

Copie o arquivo apropriado para dentro do projeto do seu agente (ao lado do
`index.js`/`bot.js`, por exemplo). Sem dependências externas — só Node 18+.

### Passo 4 — Plugar no entry point do bot

No arquivo que sobe o seu bot (`index.js`, `bot.js`, etc.), adicione 3 linhas:

**CommonJS (`require`)**

```js
const { createHeartbeat } = require("./openclaw-heartbeat");

createHeartbeat({
  dashboardUrl: process.env.OPENCLAW_URL,
  agentId:      process.env.OPENCLAW_AGENT_ID,
  secret:       process.env.OPENCLAW_SECRET,
  version:      process.env.npm_package_version || "1.0.0",
}).start();

// …resto do seu bot (bot.launch(), etc.)
```

**ESM (`import`)**

```js
import { createHeartbeat } from "./openclaw-heartbeat.mjs";

createHeartbeat({
  dashboardUrl: process.env.OPENCLAW_URL,
  agentId:      process.env.OPENCLAW_AGENT_ID,
  secret:       process.env.OPENCLAW_SECRET,
  version:      process.env.npm_package_version || "1.0.0",
}).start();
```

### Passo 5 — Variáveis de ambiente do bot

No `.env` do **projeto do agente** (não confundir com o `.env` do painel):

```env
OPENCLAW_URL=http://localhost:3100
OPENCLAW_AGENT_ID=lucas-tg-suporte-01
OPENCLAW_SECRET=ocs_xxxxxxxxxxxxxxxx
```

- Se painel e agente rodam na **mesma VPS**, use `http://localhost:3100`.
- Se rodam em máquinas diferentes, use o IP/domínio público do painel.

Repita o processo **para cada bot**: cada agente tem seu próprio `agentId` e
`secret`.

### Passo 6 — Reiniciar o bot

```bash
pm2 restart <seu-bot>
# ou simplesmente pare e inicie o processo de novo
```

Em até 60 segundos o painel marca o agente como **online** e passa a mostrar
a versão reportada + horário do último heartbeat.

### Como o status é calculado

| Tempo desde o último heartbeat | Status exibido no painel |
|--------------------------------|--------------------------|
| < 2 minutos                    | 🟢 **online**            |
| 2–10 minutos                   | 🟡 **sem heartbeat**     |
| > 10 minutos                   | ⚪ **offline**           |

Ao receber `SIGINT`/`SIGTERM` (Ctrl+C, `pm2 stop`), o módulo envia um
heartbeat final com `status: "offline"` antes de sair — assim o painel mostra
offline imediatamente, sem esperar os 10 minutos.

### Troubleshooting

| Sintoma | Provável causa |
|---------|----------------|
| `heartbeat 401` | Secret errado ou agentId errado no `.env` do bot |
| `heartbeat erro: fetch failed` | Bot não alcança o painel — cheque `OPENCLAW_URL` e firewall |
| Painel mostra offline mesmo com bot rodando | Bot caiu antes de rodar `hb.start()`; cheque logs (`pm2 logs`) |
| Node reclama "fetch is not defined" | Node < 18; atualize para 18+ ou instale `node-fetch` |

### Próxima camada (em aberto)

Heartbeat informa **se** o agente está vivo. Para registrar **o que ele está
fazendo** (ingestão de uso, execução de crons, atividades de skills), há
endpoints adicionais previstos mas ainda não implementados:

- `POST /api/agents/:id/usage` — eventos de uso de LLM (tokens/custo real)
- `POST /api/agents/:id/cron-run` — resultado de execução de cron
- `POST /api/agents/:id/skill-activity` — atividade de skill ("enviou email X")
  com suporte a anexar imagem (`contentUrl`) ou conteúdo longo (`body`)

Hoje essas atividades aparecem no painel a partir de dados seedados.
Quando precisar da ingestão real, me avisa.

## 🗂️ Histórico e retenção de dados

- **Skills – histórico de atividades**: cada entrada tem data/hora exata,
  status (ok/aviso/erro), conteúdo (`body`), tipo (`text` / `image` / `link`)
  e URL. No painel, clique em uma linha pra **expandir** e ver o conteúdo
  completo — incluindo preview inline de imagens e links externos.
- **Retenção: 30 dias.** Atividades mais antigas são removidas automaticamente
  por uma rotina de limpeza throttled (executa no máximo 1× por hora, disparada
  pelo próprio painel quando alguém abre a tela de uma skill).
- **Auditoria e UsageEvents** não seguem essa retenção (audit: últimas 200
  entradas; usage: ilimitado por ora). Pode ser ajustado depois se precisar.

## Estrutura

```
src/
  auth.ts                 # Auth.js (Node runtime)
  auth.config.ts          # config edge-safe para middleware
  middleware.ts
  lib/
    prisma.ts
    active-role.ts        # cookie de role ativa
    theme.ts              # cookie de tema
    audit.ts              # helper de auditoria
    agent-status.ts       # status efetivo (online/stale/offline)
    costs.ts, costs-queries.ts
    auth-guards.ts
  app/
    login/                # public
    invite/[token]/       # public (convite)
    api/
      agents/[agentId]/heartbeat/  # public, auth via Bearer
      auth/[...nextauth]/
    actions/              # server actions (tenants, agents, users, invites,
                          # github, skills, crons, budgets, theme, role, auth)
    (app)/                # rotas autenticadas, layout com sidebar + header
      admin/
        tenants, agents, github, skills, crons, costs, users, invites, audit
      client/
        agents, costs, profile
  components/             # sidebar, header, forms, status-pill, budget-bar,
                          # heartbeat-integration, github-integration,
                          # skills-manager, crons-manager, breadcrumbs...
prisma/
  schema.prisma           # Tenant, User, Membership, Agent, Invite, AuditLog,
                          # UsageEvent, GithubIntegration, GithubRepo,
                          # Skill, AgentSkill, AgentCron, SkillActivity
  seed.ts
examples/
  openclaw-heartbeat.js   # módulo pronto (CommonJS) para colar no agente
  openclaw-heartbeat.mjs  # versão ESM
```

## Segurança e isolamento

- `requireAdmin()` / `requireSession()` / `canWriteTenant()` em todas as actions.
- **Nunca** mistura dados entre tenants; páginas `/client/*` filtram pela sessão
  e retornam 404 em recursos de outros tenants.
- GitHub: **token não é armazenado** — apenas metadados (modo, escopo, org,
  branch padrão) e os últimos 4 chars digitados para verificação visual.
- Heartbeat secret gerado por agente, rotacionável no painel.
- Ações destrutivas exigem `confirm()` no front e `requireAdmin/tenant` no servidor.
- Auditoria cobre mutações de todas as entidades.

## Próximos passos (fora desta iteração)

- Postgres + migrações
- Toasts globais (hoje temos feedback inline)
- Notificações de custo por email/webhook
- Execução real de crons (hoje só metadados)
- Webhook inbound para eventos dos agentes
