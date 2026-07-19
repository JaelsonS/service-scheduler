# Configuração externa — Service Scheduler

Guia para ligar **Supabase + local + Render + Vercel**.

## Status

| Camada | Serviço | Status |
|--------|---------|--------|
| Banco | Supabase (PostgreSQL) | Pronto — schema/seed/admin via Flyway + bootstrap |
| Backend | Local OK → **próximo: Render** | Credenciais locais configuradas |
| Frontend | Local OK → **próximo: Vercel** | `VITE_API_URL` apontando para API local |
| GitHub | Código completo precisa estar no remoto | Obrigatório antes do deploy |

Pré-requisito absoluto: **commit + push** do MVP completo (backend + frontend). Sem isso, Render/Vercel não enxergam a aplicação.

---

## Passo 1 — Supabase

1. Crie (ou abra) um projeto em [supabase.com](https://supabase.com/).
2. Em **Project Settings → Database**, copie a senha e o host.
3. Monte o JDBC:

```text
jdbc:postgresql://db.<PROJECT_REF>.supabase.co:5432/postgres?sslmode=require
```

4. Configure `backend/.env` a partir do exemplo (nunca commitar o `.env`):

```bash
cp backend/.env.example backend/.env
```

Preencha pelo menos: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`.

Na primeira subida da API, o Flyway aplica/baselina as migrations e o bootstrap cria o admin se a tabela estiver vazia.

---

## Passo 2 — Rodar local (validar antes do deploy)

### Backend

```bash
cd backend
set -a && source .env && set +a
./mvnw spring-boot:run
```

Validar:

- Health: http://localhost:8080/actuator/health → `UP`
- Serviços: http://localhost:8080/api/v1/services
- Swagger (dev): http://localhost:8080/swagger-ui.html

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

- App: http://localhost:5173
- Admin: http://localhost:5173/admin/login

Credenciais **somente desenvolvimento** (bootstrap):

| Campo | Valor |
|-------|--------|
| E-mail | `admin@agendapro.local` |
| Senha | `Admin@12345` |

---

## Passo 3 — Deploy backend no Render

> **Importante:** o Render **não tem runtime Java**. Use **Language = Docker**.

1. Faça push do repositório completo no GitHub.
2. [dashboard.render.com](https://dashboard.render.com) → **New → Web Service** → repo `service-scheduler`.
3. Preencha assim:

| Campo | Valor |
|-------|--------|
| Language | **Docker** |
| Branch | `main` |
| Region | Frankfurt (ou a mais próxima) |
| Root Directory | `backend` |
| Dockerfile Path | `backend/Dockerfile` |
| Instance | **Free** |

4. Não precisa de Build/Start Command — o Docker cuida disso.

### Variáveis de ambiente (Render)

| Key | Valor |
|-----|--------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | JDBC do Supabase com `?sslmode=require` |
| `DB_USERNAME` | `postgres` (ou o user do projeto) |
| `DB_PASSWORD` | senha do Supabase |
| `CORS_ALLOWED_ORIGINS` | URL da Vercel (ex.: `https://seu-app.vercel.app`) |
| `JWT_SECRET` | string aleatória nova (≥ 32 chars) — **não** reutilize a de dev |
| `ADMIN_EMAIL` | e-mail admin da demo |
| `ADMIN_PASSWORD` | senha forte (não use `Admin@12345`) |
| `JWT_ACCESS_MINUTES` | `30` |
| `JWT_REFRESH_DAYS` | `7` |
| `APP_TIMEZONE` | `America/Sao_Paulo` |
| `SPRINGDOC_ENABLED` | `false` |
| `DB_POOL_MAX_SIZE` | `5` |
| `DB_POOL_MIN_IDLE` | `1` |

> Se `admin_users` já tiver registro (criado no local), o bootstrap **não** altera a senha. Use as credenciais já existentes ou limpe/recrie o admin no banco.

5. Após o deploy, anote a URL, ex.: `https://service-scheduler-api.onrender.com`  
   Base da API para o frontend: `https://…onrender.com/api/v1`

**Nota (plano free):** o serviço pode “dormir” após inatividade; a primeira request demora ~30–60s. Mencione isso no README da demo.

---

## Passo 4 — Deploy frontend na Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importe o repositório.
2. Configure:

| Campo | Valor |
|-------|--------|
| Root Directory | `frontend` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

3. Environment Variable:

| Key | Valor |
|-----|--------|
| `VITE_API_URL` | `https://SEU-BACKEND.onrender.com/api/v1` |

4. Deploy.
5. Volte no Render e atualize `CORS_ALLOWED_ORIGINS` com a URL da Vercel.
6. Redeploy do backend para aplicar CORS.

`frontend/vercel.json` já trata o rewrite SPA.

---

## Passo 5 — Checklist de smoke test em produção

- [ ] `GET /actuator/health` → `UP`
- [ ] Home carrega serviços
- [ ] Criar agendamento
- [ ] Página de confirmação
- [ ] `/admin/login` autentica
- [ ] Listar / filtrar / mudar status / excluir
- [ ] Logout e `/admin` redireciona para login

---

## Segurança

- Nunca commitar `backend/.env` ou `frontend/.env`
- Em produção, **não** use `Admin@12345`
- Gere `JWT_SECRET` novo no Render
- Mantenha `SPRINGDOC_ENABLED=false` em produção
- Não publique project ref / senhas do Supabase em docs públicos

---

## Ordem recomendada

1. Push do código completo no GitHub  
2. Render (backend) com vars do Supabase  
3. Vercel (frontend) com `VITE_API_URL`  
4. Ajustar CORS e redeploy do backend  
5. Smoke test + links no README  
