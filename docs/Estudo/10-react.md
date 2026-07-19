# 10 — React

## O que é?

**React** é uma biblioteca para construir interfaces com componentes e estado.

Neste projeto usamos React 19 + TypeScript + Vite, com React Router para rotas, Axios para HTTP, React Hook Form + Zod para formulários e Tailwind CSS para estilo.

## Por que usamos?

- Separar área do cliente e área admin em uma SPA.
- Tipagem forte com TypeScript nos contratos da API.
- Componentização reutilizável (UI, booking, layout).
- Boa DX com Vite (build rápido) e deploy simples na Vercel.

## Como está sendo usado neste projeto?

Estrutura principal:

```text
frontend/src/
  api/           → Axios + funções por domínio (não chamar Axios nos componentes)
  hooks/         → useServices, useAvailability, useAdminAppointments, useToast
  auth/          → AuthProvider, useAuth, contexto
  components/    → ui, layout, booking, auth
  pages/         → Home, Confirmation, admin/Login, admin/Appointments
  types/         → contratos TypeScript
```

Rotas (`App.tsx`):

| Rota | Acesso |
|------|--------|
| `/` | Pública — agendamento |
| `/confirmacao/:id` | Pública — confirmação |
| `/admin/login` | Pública — login admin |
| `/admin` | Protegida (`ProtectedRoute`) — painel |

Padrões de qualidade:

- camada `api/` centraliza HTTP;
- hooks encapsulam loading/erro/dados;
- estados de UI: loading, empty, error, toast, modal;
- formulário de booking com validação Zod espelhando regras do backend;
- autenticação admin com refresh automático no interceptor Axios.

Fluxo do cliente:

```text
HomePage → BookingForm → api/appointments → confirmação
```

Fluxo do admin:

```text
/admin/login → JWT → /admin → listar/filtrar/status/excluir
```
