# Decisões arquiteturais (AgendaPro)

Notas curtas do que eu decidi no desafio DevClub (7 dias).  
Não é Clean Architecture completa — é o mínimo sólido pra entregar agendamento confiável.

## Visão geral

```text
React (Vercel) → Spring Boot (Render) → PostgreSQL (Supabase)
```

Camadas no back: `controller` → `service` → `repository` (+ `entity`, `dto`, `config`).

---

## ADR-001 — Camadas em vez de Clean Architecture

**Problema:** misturar HTTP, regra e SQL no mesmo lugar vira bagunça rápido.  
**Escolhi:** controller / service / repository.  
**Não escolhi:** ports/adapters ou microsserviços — exagero pro prazo e pro tamanho.  
**Se crescer:** dá pra extrair módulos depois sem reescrever tudo.

## ADR-002 — Entidade `Service`

**Problema:** guardar nome do serviço como texto no agendamento duplica e inconsistência.  
**Escolhi:** tabela `services` + `ManyToOne` LAZY em `Appointment`.  
**Obs. honesta:** `durationMinutes` aparece na UI, mas a grade de slots ainda é fixa em 30 min (`BusinessHours`). Duração é informativa no MVP; overlap real fica pra evolução.

## ADR-003 — Flyway + `ddl-auto=validate`

**Problema:** `update`/`create` no Hibernate muda schema sem histórico.  
**Escolhi:** migrations `V1`–`V4` + Hibernate só valida.  
**Banco:** Postgres no Supabase (connection pooler no Render por causa de IPv4).

## ADR-004 — DTOs na API

**Problema:** devolver Entity vaza campos, dispara lazy e acopla front ao JPA.  
**Escolhi:** request/response DTOs + Bean Validation (`@Valid`).

## ADR-005 — Regras no Service

Disponibilidade, conflito, transição de status e cancelamento ficam no `service`.  
Controller só recebe, valida entrada e responde.

## ADR-006 — Concorrência: app + banco

1. Service checa se o slot está livre (mensagem clara).  
2. Índice único parcial no Postgres: mesmo `(date, time)` só se status ≠ `CANCELADO`.  
3. Violação vira **409 Conflict**.  

Sem isso, duas requests simultâneas passariam na checagem e gravariam as duas.

## ADR-007 — JWT (admin + cliente)

API stateless entre Vercel e Render.  
Roles: `ADMIN` e `CLIENT`. Access curto + refresh longo.  
Agendamento público continua sem login; se vier Bearer `CLIENT`, amarro `client_user_id`.

**Limitação:** denylist de refresh em memória — some no restart do Render. Produto real → Redis/tabela.

## ADR-008 — Escopo consciente

**Entrega:** agendar, disponibilidade, admin JWT, conta cliente opcional, rate limit básico, SEO.  
**Fora de propósito:** CRUD completo de serviços, profissionais, WhatsApp, multi-tenant, CI/CD pesado.  
Docker do backend **já existe** (`backend/Dockerfile`) pro deploy no Render — não é “futuro”.

## ADR-009 — Front React + Vite

SPA com TypeScript, React Router, Axios, Hook Form + Zod, Tailwind.  
Telefone de cadastro com `react-phone-number-input` (E.164).

## ADR-010 — Tratamento de erro centralizado

`@RestControllerAdvice` padroniza 400/401/403/404/409/500 em JSON previsível pro front.

---

## Referência de escopo

Detalhes de produto e o que ficou de fora: [project-decisions.md](project-decisions.md).  
Setup de contas externas: [setup-externo.md](setup-externo.md).
