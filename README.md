# AgendaPro

Agendamento online de serviços — sem conflito de horário, com painel admin e conta de cliente opcional.

Feito para o desafio técnico DevClub. Empacotado como produto: API Java, SPA React, Postgres em produção, demos públicas.

[![Java](https://img.shields.io/badge/Java-25-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ecf8e)](https://supabase.com/)

---

## Experimente agora

| | Link |
|---|------|
| **Demo (Vercel)** | https://service-scheduler-puce.vercel.app |
| **API** | https://service-scheduler-l3g7.onrender.com/api/v1 |
| **Health** | https://service-scheduler-l3g7.onrender.com/actuator/health |
| **Código** | https://github.com/JaelsonS/service-scheduler |

> Plano free do Render: a API pode “dormir”. A 1ª chamada após idle leva ~30–60s — depois responde normal.

### Contas de demo

| Papel | Acesso |
|-------|--------|
| **Admin** | `/admin/login` → `admin@agendapro.local` / `Admin@12345` |
| **Cliente** | `/cadastro` (crie a sua) → `/minha-conta` |
| **Visitante** | `/` — agenda sem login |

---

## O que o produto faz

**Visitante** escolhe data → horário livre → serviço e dados → confirmação.

**Cliente** (opcional) cria conta, vê e cancela os próprios agendamentos.

**Admin** autentica com JWT, lista/filtra a agenda, muda status, cancela ou exclui.

Regra de ouro: dois agendamentos ativos **não** ocupam o mesmo horário — validação na API + índice único parcial no Postgres.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind 4, React Router, Hook Form, Zod, Axios |
| Backend | Java 25, Spring Boot 4.1, JPA, Security, Bean Validation, Flyway, Actuator |
| Auth | JWT (access + refresh), BCrypt, roles `ADMIN` / `CLIENT` |
| Dados | PostgreSQL (Supabase) |
| Deploy | Vercel (front) · Render + Docker (API) |

Por quê essas escolhas: [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Arquitetura (visão rápida)

```text
Browser (Vercel)
   │  HTTPS
   ▼
Spring Boot (Render)
   RateLimit → JWT filter → Controller → Service → Repository
   │
   ▼
PostgreSQL (Supabase)  ←  Flyway V1–V4
```

Monorepo:

```text
service-scheduler/
├── backend/     # API + Dockerfile + .env.example
├── frontend/    # SPA + vercel.json + .env.example
├── docs/        # DECISIONS.md (porquês)
└── README.md    # este arquivo
```

---

## Rodar local (10 minutos)

### Precisa ter

- Java 25  
- Node.js 20+  
- PostgreSQL (Supabase free ou Postgres local)

### 1) Backend

```bash
cd backend
cp .env.example .env
# edite DB_*, JWT_SECRET, ADMIN_*, CORS_ALLOWED_ORIGINS=http://localhost:5173
```

| Variável | Obrigatória | Exemplo / nota |
|----------|-------------|----------------|
| `DB_URL` | sim | `jdbc:postgresql://...` |
| `DB_USERNAME` / `DB_PASSWORD` | sim | credenciais do banco |
| `JWT_SECRET` | sim | ≥ 32 caracteres aleatórios |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | sim | admin criado no 1º boot |
| `CORS_ALLOWED_ORIGINS` | recomendada | `http://localhost:5173` |
| `SPRING_PROFILES_ACTIVE` | local: `dev` | no Render: `prod` |

```bash
export $(grep -v '^#' .env | xargs)
./mvnw spring-boot:run
```

- API: http://localhost:8080/api/v1  
- Health: http://localhost:8080/actuator/health  
- Swagger (só `dev`): http://localhost:8080/swagger-ui.html  

Flyway aplica `V1`–`V4` e o seed de serviços sozinho.

> **Supabase no Render:** use o **Session pooler** (IPv4). Host `db.*.supabase.co` é IPv6 e costuma falhar no Render.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:8080/api/v1
npm install
npm run dev
```

Abra http://localhost:5173

Para apontar o front local na API de produção (só testes):

```env
VITE_API_URL=https://service-scheduler-l3g7.onrender.com/api/v1
```

---

## API (essencial)

Base: `/api/v1`

| Método | Rota | Auth | Uso |
|--------|------|------|-----|
| `GET` | `/services` | — | Catálogo |
| `GET` | `/appointments/availability?date=` | — | Slots livres |
| `POST` | `/appointments` | — * | Criar agendamento |
| `GET` | `/appointments/{id}` | — | Confirmação |
| `POST` | `/auth/login` | — | Login admin |
| `POST` | `/auth/refresh` · `/auth/logout` | — | Sessão JWT |
| `POST` | `/client/auth/register` · `/login` | — | Conta cliente |
| `GET` | `/client/me` · `/client/appointments` | `CLIENT` | Área do cliente |
| `POST` | `/client/appointments/{id}/cancel` | `CLIENT` | Cancelar o próprio |
| `GET` | `/admin/appointments` · `/summary` | `ADMIN` | Painel |
| `PATCH` | `/admin/appointments/{id}/status` | `ADMIN` | Status |
| `POST`/`DELETE` | `/admin/appointments/{id}/cancel` · `/{id}` | `ADMIN` | Cancelar / excluir |

\*Com Bearer `CLIENT`, o agendamento vincula à conta (`client_user_id`).

---

## Qualidade e segurança (MVP)

```bash
cd backend && ./mvnw test
cd frontend && npm run ci
```

- Validação: Bean Validation (API) + Zod (UI)  
- Auth: Spring Security + JWT por role  
- Concorrência: índice único parcial + `409 Conflict`  
- CORS sem `*` · rate limit por IP · Swagger off em `prod`  
- Segredos só em `.env` / painel do host (nunca no Git)

---

## Deploy (resumo)

1. **Supabase** — banco + connection string (pooler)  
2. **Render** — `backend/Dockerfile`, env `prod`, health `/actuator/health`  
3. **Vercel** — root `frontend`, `VITE_API_URL` = API pública + `/api/v1`  
4. Ajuste `CORS_ALLOWED_ORIGINS` com a URL da Vercel se precisar  

Detalhes de decisão e trade-offs: [`docs/DECISIONS.md`](docs/DECISIONS.md).

---

## Autor

**Jaelson Santos** — desafio técnico DevClub · portfolio full-stack (Java + React).
