# OpenClaw Dashboard

Painel multi-tenant de agentes OpenClaw. Fase 1 entrega o **painel admin** com
listagem de clientes, agentes e usuários, além de contas **dual-role**
(admin + cliente) com toggle de papel no header.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + componentes inspirados em shadcn/ui
- **Auth.js v5** (Credentials + JWT)
- **Prisma** + **SQLite** (fase 1 — fácil de migrar para Postgres depois)

## Rodando localmente

```bash
npm install
npx prisma db push      # cria o schema em prisma/dev.db
npm run db:seed         # cria tenants de exemplo + conta do Lucas
npm run dev             # http://localhost:3000
```

### Conta seed

- **Email:** `lucas.odantas@gmail.com`
- **Senha:** `changeme`
- **Papéis:** `admin` + `cliente` (tenant `dantas-labs`)

O toggle de papel aparece no header sempre que a conta tem mais de uma role.

## Estrutura

```
src/
  auth.ts              // config Auth.js (Node runtime, usa bcrypt + Prisma)
  auth.config.ts       // config edge-safe usada no middleware
  middleware.ts        // protege rotas, redireciona /admin se não for admin
  lib/
    prisma.ts          // singleton Prisma
    active-role.ts     // resolve a role ativa via cookie
  app/
    login/             // página de login
    actions/           // server actions (login, logout, switchRole)
    (app)/             // layout com sidebar + header (protegido)
      admin/           // painel admin — todos os tenants/agentes/usuários
      client/          // painel cliente — somente tenants do usuário
prisma/
  schema.prisma        // Tenant, User, Membership, Agent
  seed.ts              // dados iniciais
```

## Modelo de roles

- `User.isAdmin: boolean` → controla acesso ao `/admin`.
- `Membership(userId, tenantId)` → vínculos que habilitam `/client`.
- Usuário com ambos vê o toggle no header (cookie `openclaw_active_role`).

## Próximos passos

1. CRUD de tenants e agentes direto no painel.
2. Integração GitHub por agente (gh CLI ou MCP).
3. Skills, tools e crons.
4. Telemetria de custo de LLM por agente/tenant.
