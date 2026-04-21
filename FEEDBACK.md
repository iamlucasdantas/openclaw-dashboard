# Dashboard Feedback — OpenClaw Admin Hub

**Última atualização:** 2026-04-21 (01:16 CDT)
**Status:** Em desenvolvimento ativo — 2 semanas de iterações

---

## Sprint 1 — UX & Navegação (Prioridade: ALTA)

### [FB-001] Histórico de uso por Skill
- **Problema:** Quando clica em "Instagram Style" (ou qualquer skill), não mostra histórico de uso
- **Esperado:** Ver todos os carrosséis criados, data/hora, custo, API utilizada, status (ok/error)
- **Tabela:** `SkillActivity` existe no schema mas está vazia — precisa conectar
- **Ação:** Criar página de detalhe da skill com timeline de atividades

### [FB-002] Centro de Custos vazio
- **Problema:** Mostra muito pouco dado de custo (apenas estimativas)
- **Esperado:** Custo real por agente, por dia, por modelo, com gráfico
- **Bloqueio:** Agentes não POSTam para `/api/agents/usage` automaticamente
- **Ação:** Criar middleware/hooks no OpenClaw para reportar uso real de LLM

### [FB-003] Prospecting força configuração prematuramente
- **Problema:** Tela de prospecção exige ID e chave API do HighLevel logo de cara
- **Esperado:** Should ser só na hora da configuração (setup wizard separado)
- **Ação:** Criar fluxo: overview → criar campanha → depois configurar integração

### [FB-004] Integrações como seção global (errado)
- **Problema:** "Integrações" aparece como seção separada no menu
- **Esperado:** Integrações devem estar DENTRO de cada agente, como aba
- **Ação:** Mover integrações para dentro da página do agente

### [FB-005] Painel do Cliente não mostra agentes
- **Problema:** View `/client` não exibe os agentes do tenant
- **Esperado:** Ver meus agentes, com abas: Skills, Tarefas Agendadas (calendário), Integrações, Histórico
- **Ação:** Criar abas na página de detalhe do agente

### [FB-006] Abas no painel Admin (agente)
- **Problema:** Agente no admin não tem navegação por abas
- **Esperado:** Abas: Overview, Skills, Tarefas (calendário), Integrações, Histórico, Custos
- **Ação:** Implementar tab navigation na página `/admin/agents/[id]`

### [FB-007] Calendário de tarefas
- **Problema:** Crons listados como tabela simples, sem visão calendário
- **Esperado:** Formato de calendário (dia/semana/mês) com crons coloridos por status
- **Nota:** Já existe componente `crons-calendar.tsx` mas pode não estar aplicado corretamente

### [FB-008] Painel do cliente mostra "Integrações"
- **Problema:** Seção de integrações aparece no painel do cliente, não deveria
- **Esperado:** Integrações são configuração de agente, não visão de cliente
- **Ação:** Remover ou limitar seção de integrações na view client

---

## Sprint 2 — Dados Reais (Prioridade: ALTA)

### [FB-009] Sync automático de crons
- **Status:** ✅ Script `dashboard-sync.js` criado, roda a cada 5 min
- **Ação:** Verificar se está funcionando corretamente após deploy

### [FB-010] Status online/offline dos agentes
- **Status:** ✅ Heartbeat script rodando (60s interval)
- **Melhoria:** Axxion e Wrexham não reportam heartbeat — só ClawDantas

### [FB-011] Dados de uso reais (não estimativa)
- **Bloqueio:** OpenClaw não tem hook para reportar tokens/custo por turno
- **Workaround:** Estimativa baseada em crons ativos (placeholder)
- **Ação:** Discutir com equipe Cloud sobre middleware de billing

### [FB-012] Skill Activities vazias
- **Bloqueio:** Nenhum mecanismo para skills reportarem quando são usadas
- **Ação:** Criar wrapper ou hook no OpenClaw

---

## Sprint 3 — Mobile & UX Polish (Prioridade: MÉDIA)

### [FB-013] Otimização mobile
- **Problema:** Dashboard funciona em mobile mas layout pode melhorar
- **Ação:** Revisar responsividade de todas as páginas

### [FB-014] Dados fictícios não devem aparecer nunca
- **Problema:** Seed cria agentes fake (Acme, Initech, Lucas Ops)
- **Ação:** Remover do seed ou criar flag `--clean` que só cria dados reais

### [FB-015] Tela de login não mostra erros claros
- **Problema:** "Senha não bate" sem indicar se é email errado ou senha
- **Ação:** Melhorar mensagens de erro no login

---

## Regras de Negócio

1. **Multi-tenant**: Um cliente (tenant) pode ter múltiplos agentes
2. **Visão admin**: vê tudo (todos tenants, agentes, billing)
3. **Visão cliente**: vê só seus agentes, skills, crons, custos
4. **Skills**: Cada agente tem skills específicas atribuídas
5. **Custos**: Agregados por agente e por tenant (diário/semanal/mensal)
6. **Calendário**: Crons devem ser visíveis em formato calendário
7. **Integrações**: São por agente, não por tenant

---

## Dados Reais para Testing

### Tenant
- **slug**: `magnetic-funnels`
- **name**: Magnetic Funnels

### Agentes
| agentId | name | model |
|---------|------|-------|
| claw-dantas | ClawDantas | zai/glm-5.1 |
| axxion | Axxion | zai/glm-5.1 |
| wrexham | Wrexham | zai/glm-5-turbo |

### Login
- **Email**: lucas.odantas@gmail.com
- **Senha**: changeme

### Contagem atual
- 3 agentes, 22 skills, 36 atribuições, 62 crons, ~37 ativos
