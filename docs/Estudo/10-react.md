# 10 — React

## O que é?

**React** é uma biblioteca para construir interfaces com componentes e estado.

Neste projeto usamos React 19 + TypeScript + Vite 8, com React Router 7 para rotas, Axios para HTTP, React Hook Form + Zod para formulários e Tailwind CSS 4 para estilo.

## Por que usamos?

- Separar área do cliente e área admin em uma SPA.
- Tipagem forte com TypeScript nos contratos da API.
- Componentização reutilizável (UI, booking, layout, SEO).
- Boa DX com Vite (build rápido) e deploy simples na Vercel.

## Como está sendo usado neste projeto?

Estrutura principal:

```text
frontend/src/
  api/           → Axios + funções por domínio (não chamar Axios nos componentes)
  hooks/         → useServices, useAvailability, useAdminAppointments, useToast
  auth/          → AuthProvider, useAuth, contexto (ADMIN | CLIENT)
  components/    → ui, layout, booking, auth, SeoHead
  pages/         → Home, Confirmation, client/*, admin/*
  types/         → contratos TypeScript
```

Rotas (`App.tsx`):

| Rota | Acesso |
|------|--------|
| `/` | Pública — agendamento |
| `/confirmacao/:id` | Pública — confirmação |
| `/entrar` | Pública — login cliente |
| `/cadastro` | Pública — registro cliente |
| `/minha-conta` | Protegida (`CLIENT`) |
| `/admin/login` | Pública — login admin |
| `/admin` | Protegida (`ADMIN`) — painel |

Padrões de qualidade:

- camada `api/` centraliza HTTP e refresh automático;
- hooks encapsulam loading/erro/dados;
- estados de UI: loading, empty, error, toast, modal;
- formulários com Zod espelhando regras do backend;
- `SeoHead` atualiza title/meta/OG por rota; `robots.txt` + `sitemap.xml` no `public/`;
- feedback de cold start do Render (`BootAwareSpinner`).

Fluxo do cliente (público):

```text
HomePage → BookingForm → api/appointments → /confirmacao/:id
```

Fluxo do cliente autenticado:

```text
/cadastro|/entrar → JWT CLIENT → /minha-conta → listar/cancelar
```

Fluxo do admin:

```text
/admin/login → JWT ADMIN → /admin → listar/filtrar/status/cancelar/excluir
```
