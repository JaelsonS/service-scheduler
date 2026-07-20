# Decisões do AgendaPro

Documento único para a equipe / recrutador: **o que construímos, por quê, e o que ficou de fora**.

---

## Problema

Negócios de serviço perdem tempo com agenda no WhatsApp e horários duplicados.  
AgendaPro deixa o cliente marcar sozinho e o admin controlar a fila com status claros.

## Escopo do MVP

| Incluído | De propósito fora |
|----------|-------------------|
| Agendar sem login | CRUD completo de serviços no admin |
| Grade de horários livres | Profissionais / salas / multi-tenant |
| Admin JWT (listar, status, cancelar, excluir) | WhatsApp / e-mail transacional |
| Conta cliente opcional | Overlap real por duração do serviço |
| Flyway, rate limit, CORS restrito, SEO básico | CI/CD pesado, Redis |

## Stack e por quê

| Escolha | Motivo curto |
|---------|--------------|
| **Spring Boot + Java** | Estudar e demonstrar camadas, JPA, Security, Flyway — não só um BaaS |
| **React + Vite + TS** | SPA rápida, tipada, deploy simples na Vercel |
| **PostgreSQL (Supabase)** | Relacional sólido + hospedagem free; pooler IPv4 no Render |
| **Flyway + `ddl-auto=validate`** | Schema versionado; Hibernate não altera prod sozinho |
| **JWT access + refresh** | Front e API em hosts diferentes, API stateless |
| **Índice único parcial** | Última linha de defesa contra double-booking |

## Arquitetura

```text
controller  →  service  →  repository  →  PostgreSQL
     ↑              ↑
   DTOs + BV     regras (slot livre, status, auth)
```

- Controllers não acessam repository.  
- Entities não saem na API — só DTOs.  
- Erros centralizados em `@RestControllerAdvice`.

### Concorrência de horário

1. Service verifica se o slot está livre (UX).  
2. Postgres: unique parcial em `(date, time)` onde status ≠ `CANCELADO`.  
3. Violação → HTTP **409**.

### Auth

- `ADMIN` → `/api/v1/admin/**`  
- `CLIENT` → `/api/v1/client/**` (register/login públicos)  
- Agendamento público continua aberto; Bearer `CLIENT` opcional amarra `client_user_id`.

**Limitação admitida:** denylist de refresh em memória (some no restart do Render). Evolução: Redis/tabela.

### Duração vs slot

`durationMinutes` no serviço é **informativo** na UI. A grade é fixa em 30 min (`BusinessHours`). Evolução: bloquear N slots conforme duração.

## Entidades

`Service` · `Appointment` · `AdminUser` · `ClientUser`  
Migrations: `V1` schema · `V2` seed · `V3` admin · `V4` client + `client_user_id`.

## Front — fluxo do usuário

1. **Data** → 2. **Horário** → 3. **Serviço + dados** → confirmar.  
Cliente logado não vê atalho Admin. Telefone de cadastro em E.164 (`react-phone-number-input`).

## Deploy

Ordem: GitHub → Supabase → Render (Docker) → Vercel (`VITE_API_URL`).  
`SPRING_PROFILES_ACTIVE=prod` no Render. Swagger desligado em prod.

## O que eu melhoraria depois

1. Overlap real por duração  
2. Confirmação sem PII pública (token opaco)  
3. Refresh/rate limit em Redis  
4. Testcontainers + CI  
5. CRUD de serviços no admin  

---

*Mantido curto de propósito: o README cobre como rodar; este arquivo cobre o porquê.*
