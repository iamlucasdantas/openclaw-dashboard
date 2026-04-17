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
                          # Skill, AgentSkill, AgentCron
  seed.ts
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
