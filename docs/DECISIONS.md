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
| Grade de horários livres com duração real | Profissionais / salas / multi-tenant |
| Admin JWT (listar, status, cancelar, excluir) | WhatsApp / e-mail transacional |
| Conta cliente opcional | Vincular booking anônimo ao criar conta |
| Flyway, rate limit, CORS restrito, SEO básico | CI/CD pesado, Redis |
| Mask de telefone na confirmação pública | Token opaco na URL de confirmação |

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

1. Service verifica sobreposição por intervalo `[início, início+duração)`.  
2. Postgres: unique parcial em `(date, time)` onde status ≠ `CANCELADO` (mesmo início).  
3. Violação de unique → HTTP **409**.

### Auth

- `ADMIN` → `/api/v1/admin/**`  
- `CLIENT` → `/api/v1/client/**` (register/login públicos)  
- Agendamento público continua aberto; Bearer `CLIENT` opcional amarra `client_user_id`.  
- Refresh revogado: tabela `revoked_refresh_tokens` (hash SHA-256), migration `V5`.  
- Confirmação pública mascara telefone.

### Duração vs slot

Grade de 30 min; disponibilidade exige `serviceId` e só libera slots onde a duração cabe sem overlap.

## Entidades

`Service` · `Appointment` · `AdminUser` · `ClientUser`  
Migrations: `V1` schema · `V2` seed · `V3` admin · `V4` client · `V5` revoked refresh.

## Front — fluxo do usuário

1. **Serviço** → 2. **Data** → 3. **Horário** (respeita duração) → 4. **Dados** → confirmar.  
Cliente logado não vê atalho Admin. Telefone de cadastro em E.164 (`react-phone-number-input`).

## Deploy

Ordem: GitHub → Supabase → Render (Docker) → Vercel (`VITE_API_URL`).  
`SPRING_PROFILES_ACTIVE=prod` no Render. Swagger desligado em prod.

## O que eu melhoraria depois

1. Token opaco na URL de confirmação (além do mask)  
2. Rate limit em Redis  
3. Testcontainers + CI  
4. CRUD de serviços no admin  
5. Vincular agendamentos anônimos ao criar conta (por telefone/e-mail)  

---

*Mantido curto de propósito: o README cobre como rodar; este arquivo cobre o porquê.*
