# Auditoria de dark patterns / anti-padrões — OpenClaw Dashboard

> Levantamento das violações de UX e acessibilidade no painel atual,
> priorizado por impacto na persona-alvo ("Ana", dona de agência que usa
> HighLevel mas não programa). Acompanha a **Iteração 1** de redesign
> (copy.ts + status semântico).

---

## Legenda de prioridade

- 🔴 **Alta** — Ana desiste do produto em <30s se esbarrar nisso
- 🟠 **Média** — causa atrito recorrente, contorna
- 🟡 **Baixa** — polimento

---

## 1. Vazamento de infra na UI do cliente

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 1.1 | Palavra **"cron"** ainda aparece em `SchedulePicker` (radio "Avançado (cron)") e no hint dos wrappers | `components/schedule-picker.tsx`, `/client/crons` | 🔴 | Esconder atrás de "Modo desenvolvedor" em `/client/*`. Wizard sem a palavra. |
| 1.2 | **"heartbeat"** no título da seção `HeartbeatIntegration` no detalhe do agente | `components/heartbeat-integration.tsx` | 🔴 | Cliente vê "Conexão técnica" (aba avançada). Admin mantém. |
| 1.3 | **`agentId`** (ex: `acme-wa-support-01`) visível em 6 telas do cliente | listas, detalhe, breadcrumbs | 🔴 | Em `/client/*`, esconder. Tooltip pra suporte se precisar copiar. |
| 1.4 | **Bearer**, **curl**, endpoint HTTP, header `Authorization` | `heartbeat-integration.tsx` | 🔴 | Mover pra aba "Modo desenvolvedor" colapsada por padrão. |
| 1.5 | **"Skill"**, **"AgentSkill"**, **"slug"**, **"tenant"** espalhados | vários (breadcrumbs, tooltips, labels) | 🟠 | Substituir por copy.ts centralizado. |
| 1.6 | **Token preview** (`…a1b2`) exposto na lista global `/admin/github` — mesmo sendo só 4 chars, não precisa estar na lista | `/admin/github` | 🟡 | Mostrar só em hover ou na página do agente. |

## 2. Status binário vs semântico

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 2.1 | Pill mostra `online / offline / sem heartbeat / degraded` — zero contexto de **trabalho** | `components/status-pill.tsx` | 🔴 | 4 estados semânticos: **Trabalhando normalmente 🟢**, **Quieto no momento 🟡**, **Precisa de atenção 🟠**, **Parado 🔴**. |
| 2.2 | `degraded` é jargão — não diz o que fazer | `status-pill.tsx` | 🟠 | Rotular "Precisa de atenção" + hint explicando a causa. |
| 2.3 | "sem heartbeat" viola regra de vocabulário | `status-pill.tsx` | 🔴 | "Quieto no momento" + hint neutro em `/client`. |

## 3. Dashboards frios (contagens em vez de entregas)

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 3.1 | `/client` é **contagem de recursos** (3 agentes, 5 custos). Ana pergunta "o que meu assistente fez por mim hoje?" e o painel não responde. | `/client/page.tsx` | 🔴 | Rewrite JTBD (Diário do assistente). Próxima iteração (#1). |
| 3.2 | "Próxima tarefa" existe só dentro do agente, não na home | `/client` | 🟠 | Na home, card "Próxima tarefa: …". |
| 3.3 | Custos só em USD, sem projeção nem loss aversion | `/client/costs` | 🔴 | Converter pra BRL por padrão, projeção de fim de mês, alerta visual 70/90%. Iteração #4. |

## 4. Empty states preguiçosos

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 4.1 | "Nenhum convite emitido ainda" — sem CTA, sem explicar o valor | `/admin/invites` | 🟠 | Já tem EmptyState em algumas, completar cobertura. |
| 4.2 | `/client` com 0 agentes cai em "Você ainda não está vinculado a nenhum cliente" — hostil pra onboarding | `/client/page.tsx` | 🔴 | Hero "Conheça o Eugênio, seu primeiro assistente" + CTA criar. Iteração #5. |
| 4.3 | GitHub vazio diz "Nenhum agente com GitHub configurado" sem explicar o que é | `/admin/github` | 🟠 | Explicação do valor + link "Aprender em 2min". |

## 5. Ações destrutivas fracas

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 5.1 | Excluir agente usa `confirm()` nativo — sem reflexo do impacto (cron, skills, custos atrelados) | `components/delete-button.tsx` | 🟠 | Modal com **type-to-confirm** (digitar o nome), lista de "o que será perdido", texto "Desligar assistente". |
| 5.2 | Excluir tenant idem — dispara cascata sem aviso | `/admin/tenants/[slug]` | 🟠 | Mesma lógica. |

## 6. Mensagens de erro cruas

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 6.1 | "heartbeat 401: Token inválido" aparece no log do agente — ok, mas ações do painel expõem erros Prisma/zod crus em alguns pontos | vários | 🟡 | Mapear erros técnicos pra mensagem humana + CTA "Pedir ajuda". |

## 7. Admin e Cliente visualmente indistintos

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 7.1 | Toggle Admin/Cliente é sutil — fácil achar que está no mesmo modo e executar ação errada | `header.tsx` | 🟠 | Faixa superior sutil quando em admin (ex: borda-t amarela de 2px + texto "modo administrador" no sidebar). |
| 7.2 | Breadcrumbs do cliente mostram slugs (`acme`) em vez de nomes humanos | vários | 🟠 | Breadcrumbs sempre com `tenant.name` em cliente. Admin pode ver slug. |

## 8. Acessibilidade

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 8.1 | `text-muted-foreground` no tema escuro tem contraste **~3.8:1** sobre `bg-card` — falha WCAG AA pra texto normal (mínimo 4.5:1) | global | 🔴 | Subir pra `#9CA3AF` ou equivalente (`text-muted-foreground` precisa redefinir a HSL do tema escuro). |
| 8.2 | Botões `variant="ghost"` e `"secondary"` não têm focus ring visível | `components/form.tsx` | 🟠 | Adicionar `focus:ring-2 focus:ring-ring focus:outline-none` como default do componente. |
| 8.3 | Ícones sem `aria-label` em vários lugares (ex: botões só com ícone `Pause`, `Trash2`) | componentes | 🟠 | Atributo `title` e `aria-label` em todo botão icon-only. Já temos `title=` em alguns. |
| 8.4 | `aria-live` faltando em toasts / estados de sucesso inline | forms | 🟡 | Wrapper de sucesso com `role="status" aria-live="polite"`. |
| 8.5 | Animações (spin, transition) não respeitam `prefers-reduced-motion` | globals.css | 🟡 | Media query `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }`. |
| 8.6 | Tipografia corpo fica em 14px em várias listas — público 35+ | mobile | 🟠 | Base 16px, escala de 14→12 só pra metadados. |

## 9. Densidade e mobile

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 9.1 | Chips de tarefas no `CronsCalendar` se sobrepõem em <375px | `crons-calendar.tsx` | 🟡 | Em telas pequenas, trocar chips por bolinhas coloridas + lista abaixo. |
| 9.2 | Form de criação de cron (SchedulePicker) tem 6 radios lado-a-lado em 2 cols — em iPhone SE fica apertado | `schedule-picker.tsx` | 🟡 | Pilha vertical em <640px. |

## 10. Microcopy

| # | Violação | Onde | Prio | Ação |
|---|----------|------|------|------|
| 10.1 | "Criar integração", "Configurar integração" | GitHub form | 🟠 | "Conectar ao GitHub". |
| 10.2 | "Excluir agente" | ações | 🟠 | "Desligar assistente". |
| 10.3 | "Revogar convite" | invites | 🟡 | "Cancelar convite". |
| 10.4 | "Novo cron" → "Adicionar tarefa" (parcialmente feito) | vários | 🟠 | Padronizar. |

---

## Referências

- Nielsen Norman Group — **Progressive Disclosure** (2006, atualizado 2023), **10 Usability Heuristics**, "Dashboard Design: 8 Best Practices" (2023)
- Refactoring UI — Schoger & Wathan — contraste em dark mode, hierarquia
- Baymard Institute — padrões de formulário destrutivo (type-to-confirm)
- Apple HIG — feedback de status (semantic color + label + icon)
- Material Design 3 — motion tokens respeitando `reduced-motion`
- WCAG 2.1 AA — contraste 4.5:1 / 3:1, focus ring
- Benchmarks visuais: Stripe Dashboard (clareza fiscal), Linear (activity-first), Vercel Usage (projeção), Intercom "Fin" (assistente personificado), GoHighLevel (vocabulário familiar)

---

## Próximas iterações (roadmap)

Esta auditoria alimenta as entregas seguintes:

1. ✅ **#7 Auditoria** (este doc) + **#6 copy.ts** — Iteração 1
2. 🚧 **#1 Redesign /client (Home JTBD)** — Iteração 2
3. ⏳ **#2 Redesign /client/agents/[id] com tabs + progressive disclosure**
4. ⏳ **#3 Wizard de agendamento sem cron**
5. ⏳ **#4 Custos com projeção, loss aversion, BRL**
6. ⏳ **#5 Empty states + onboarding first-run + template gallery**
