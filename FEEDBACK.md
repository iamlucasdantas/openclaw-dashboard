# Dashboard Feedback — OpenClaw Admin Hub

**Última atualização:** 2026-04-21 (01:20 CDT)  
**Status:** Em desenvolvimento ativo — 2 semanas de iterações  
**Método:** Lucas dá feedback → ClawDantas anota → push → Claude Code implementa → deploy → teste → ciclo repete

---

## 🏗️ Arquitetura Atual

### Estrutura de Páginas

#### Admin (`/admin`)
| Rota | Componente | Status |
|------|-----------|--------|
| `/admin` | Overview (dashboard) | ✅ Funciona |
| `/admin/tenants` | Lista tenants | ✅ Funciona |
| `/admin/agents` | Lista agentes | ✅ Funciona |
| `/admin/agents/[id]` | Detalhe do agente (tudo inline) | ⚠️ Precisa abas |
| `/admin/integrations` | Lista integrações (global) | ❌ Deveria ser por agente |
| `/admin/integrations/[slug]` | Detalhe integração | ❌ Remover do admin |
| `/admin/prospecting` | Lista campanhas | ⚠️ Força config prematura |
| `/admin/prospecting/[id]` | Detalhe campanha | ✅ |
| `/admin/prospecting/[id]/mapping` | Mapeamento fields | ✅ |
| `/admin/skills` | Catálogo de skills | ✅ |
| `/admin/skills/[id]` | Detalhe skill | ⚠️ Sem histórico de uso |
| `/admin/crons` | Lista crons (todos) | ⚠️ Sem visão calendário por padrão |
| `/admin/costs` | Centro de custos | ⚠️ Dados muito pobres |
| `/admin/github` | Integração GitHub | ✅ |
| `/admin/users` | Lista usuários | ✅ |
| `/admin/invites` | Convites | ✅ |
| `/admin/audit` | Log de auditoria | ✅ |

#### Client (`/client`)
| Rota | Componente | Status |
|------|-----------|--------|
| `/client` | Home com grid de agentes | ⚠️ Não mostra agentes |
| `/client/agents` | Lista agentes | ⚠️ Vazio |
| `/client/agents/[id]` | Detalhe do agente | ⚠️ Precisa abas |
| `/client/integrations` | Integrações | ❌ Não deveria existir no client |
| `/client/prospecting` | Prospecção | ⚠️ Força config |
| `/client/crons` | Tarefas agendadas | ✅ |
| `/client/costs` | Custos | ⚠️ Dados pobres |
| `/client/profile` | Perfil do usuário | ✅ |

### Componentes Existentes
- ✅ `crons-calendar.tsx` — Calendário visual (existe mas pode não ser padrão)
- ✅ `crons-agenda.tsx` — Lista tipo agenda
- ✅ `agent-tabs/` — Componentes de tab (TabSummary, TabActivity, TabConnections, TabDeveloper)
- ✅ `costs/` — Componentes de custo (SpentCard, ProjectionCard, LimitCard, RecentDays, WhoIsWorking)
- ✅ `heartbeat-integration.tsx` — Integração heartbeat
- ✅ `skills-manager.tsx` — Gerenciador de skills
- ✅ `crons-manager.tsx` — Gerenciador de crons

### Menu Lateral (Nav)
**Admin:** Overview → Tenants → Agentes → Integrações → Prospecção → GitHub → Skills → Crons → Custos → Usuários → Convites → Auditoria  
**Client:** Home → Agentes → Integrações → Prospecção → Agenda → Custos → Perfil

---

## 🐛 Sprint 1 — UX & Navegação (Prioridade: ALTA)

### [FB-001] Detalhe do agente PRECISA ter abas
- **Onde:** `/admin/agents/[id]` e `/client/agents/[id]`
- **Problema:** Tudo jogado numa página só (skills, crons, custo, heartbeat, github, budget inline)
- **Esperado:** Navegação por abas: **Overview | Skills | Agenda (calendário) | Custos | Integrações | Histórico**
- **Nota:** Já existem componentes `agent-tabs/*` mas NÃO estão sendo usados na página de detalhe
- **Ação:** Refatorar página de agente para usar tab layout com componentes existentes

### [FB-002] Histórico de uso por Skill
- **Onde:** `/admin/skills/[id]` e dentro da aba Skills do agente
- **Problema:** Clica na skill, não mostra o que foi feito (quais carrosséis, custo, API)
- **Esperado:** Timeline de atividades (SkillActivity): data, tipo (text/image/link), resumo, status (ok/error)
- **Tabela:** `SkillActivity` existe no schema mas está VAZIA (zero registros)
- **Ação:** Criar view de atividades da skill + conectar agentes para reportar uso

### [FB-003] Centro de Custos com dados reais
- **Onde:** `/admin/costs` e `/client/costs`
- **Problema:** Mostra valores quase zero (estimativas placeholder)
- **Esperado:** Custo real diário/semanal/mensal por agente, com gráfico
- **Componentes:** `costs/SpentCard`, `costs/RecentDays`, `costs/ProjectionCard` já existem
- **Bloqueio:** Agentes não POSTam para `/api/agents/usage` — precisa middleware no OpenClaw
- **Ação:** Implementar reporting de custo por turno no agente

### [FB-004] Integrações como seção global (ERRADO)
- **Onde:** `/admin/integrations` e `/client/integrations`
- **Problema:** Integrações aparecem como seção separada no menu, mas deveriam estar DENTRO de cada agente
- **Esperado:** Dentro da página do agente, aba "Integrações" com HighLevel, GitHub, WhatsApp, etc
- **Ação:** Remover `/admin/integrations` e `/client/integrations` do menu; mover para aba do agente

### [FB-005] Painel do Cliente não mostra agentes
- **Onde:** `/client` e `/client/agents`
- **Problema:** Grid de agentes vazio — "Seus assistentes" aparece mas sem dados
- **Esperado:** Mostrar os 3 agentes do tenant com status, skills count, custo do mês
- **Ação:** Debug query — pode ser problema de tenantId ou membership

### [FB-006] Calendário como visão padrão de crons
- **Onde:** `/admin/crons` e `/client/crons`
- **Problema:** Crons aparecem como tabela (calendar existe mas pode não ser padrão)
- **Esperado:** Calendário visual como DEFAULT, com toggle para lista
- **Nota:** `crons-calendar.tsx` e `cron-view-toggle.tsx` já existem
- **Ação:** Garantir que calendário seja a view padrão

### [FB-007] Prospecção força config prematuramente
- **Onde:** `/admin/prospecting/new` e `/client/prospecting/new`
- **Problema:** Tela pede location ID e API key do HighLevel logo de cara
- **Esperado:** Fluxo: criar campanha com nome/nicho → depois configurar HighLevel
- **Ação:** Wizard em 2 passos: (1) dados da campanha, (2) integração HighLevel

### [FB-008] Menu do Client remove integrações
- **Onde:** `/client` nav
- **Problema:** "Integrações" aparece no menu do cliente, não deveria
- **Esperado:** Remove integrações do menu client; mantém em admin ou dentro do agente
- **Ação:** Remover item do `clientNav` em `nav-links.tsx`

---

## 🔗 Sprint 2 — Dados Reais (Prioridade: ALTA)

### [FB-009] Sync automático de crons ✅ FEITO
- **Status:** Script `dashboard-sync.js` criado, roda a cada 5 min via cron
- **Nota:** Funciona, 62 crons sincronizados

### [FB-010] Heartbeat dos agentes
- **Status:** ✅ ClawDantas reporta heartbeat (60s)
- **Problema:** Axxion e Wrexham NÃO reportam — aparecem como "unknown"
- **Ação:** Configurar heartbeat nos outros 2 agentes ou usar proxy

### [FB-011] Dados de uso reais (URGENTE)
- **Bloqueio:** OpenClaw não tem hook para reportar tokens/custo por turno
- **Workaround atual:** Estimativa baseada em crons ativos (placeholder)
- **Ação:** Discutir com equipe Cloud sobre middleware de billing no OpenClaw

### [FB-012] Skill Activities (URGENTE)
- **Bloqueio:** Zero registros — nenhum mecanismo para skills reportarem uso
- **Ação:** Criar wrapper ou hook para registrar quando skill é usada

### [FB-013] Status de Agentes
- **Problema:** Axxion/Wrexham sempre "unknown" porque não reportam heartbeat
- **Ação:** O heartbeat script deve ter secrets de todos os agentes

---

## 📱 Sprint 3 — Mobile & Polish (Prioridade: MÉDIA)

### [FB-014] Mobile optimization
- **Problema:** Layout funcional mas pode melhorar em telas pequenas
- **Ação:** Revisar responsividade de todas as páginas

### [FB-015] Seed sem dados fictícios
- **Problema:** `npx prisma db seed` cria Acme, Initech, Lucas Ops
- **Ação:** Criar `seed-clean.ts` que só popula dados reais

### [FB-016] Mensagens de erro no login
- **Problema:** "Senha não bate" sem especificar o problema
- **Ação:** "Email não encontrado" vs "Senha incorreta"

### [FB-017] Notifications/toasts
- **Problema:** Sem feedback visual após ações (criar cron, salvar, etc.)
- **Ação:** Adicionar toast notifications

---

## 📋 Regras de Negócio

1. **Multi-tenant**: Um cliente (tenant) pode ter múltiplos agentes
2. **Admin vê tudo**: Todos tenants, agentes, billing, auditoria
3. **Cliente vê só o dele**: Seus agentes, skills, crons, custos
4. **Skills por agente**: Cada agente tem skills específicas atribuídas
5. **Custos agregados**: Por agente e por tenant (diário/semanal/mensal)
6. **Crons em calendário**: Formato visual por padrão
7. **Integrações por agente**: NÃO como seção global
8. **Prospectação wizard**: Config HighLevel só depois de criar campanha

---

## 🧪 Dados para Testing

### Login
- **Email:** lucas.odantas@gmail.com
- **Senha:** changeme

### Tenant: magnetic-funnels
| agentId | name | model | skills |
|---------|------|-------|--------|
| claw-dantas | ClawDantas | zai/glm-5.1 | 18 |
| axxion | Axxion | zai/glm-5.1 | 10 |
| wrexham | Wrexham | zai/glm-5-turbo | 8 |

### Contagem
- 3 agentes, 22 skills catalogadas, 36 atribuições, 62 crons (37 ativos)

### Heartbeat Secrets
- claw-dantas: `ocs_7iiJ3o0b0iCfujff1f3od-uMmk873sED`
- axxion: `ocs_l2gr-CJCoVQFAC5HlEPIgY--1_n4S80v`
- wrexham: `ocs_AYy_7TSGO23kYeV9jnnfxKgba6l0rnp1`

---

## 📌 Deploy SOP

```bash
cd /tmp/openclaw-dashboard && git pull origin claude/agent-orchestration-panel-YBuQv
rsync -a --delete --exclude=node_modules --exclude=.next --exclude='.git' /tmp/openclaw-dashboard/ /root/openclaw-dashboard/
cd /root/openclaw-dashboard
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npx prisma generate
npm run build
pm2 restart openclaw-dashboard --update-env
pm2 save
```

## ⚠️ Regras Críticas
- ⛔ Workspace `/root/.openclaw/workspace/` NUNCA pode ter `.git/`
- Deploy staging SEMPRE em `/tmp/openclaw-dashboard/`
- Após todo git pull: `prisma db push` + `prisma generate` + `npm run build`
- `pm2 save` obrigatório após mudanças
- PM2 processes: openclaw-dashboard, dashboard-heartbeat, dashboard-sync, webhook-session
