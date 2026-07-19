# 09 — JWT

## O que é?

**JWT (JSON Web Token)** é um token assinado que carrega claims (sujeito, expiração, tipo, etc.) e permite autenticação stateless.

O cliente envia o token no header:

```http
Authorization: Bearer <accessToken>
```

O servidor valida assinatura e expiração sem precisar guardar sessão HTTP.

## Por que usamos?

- Frontend (Vercel) e backend (Render) são origens separadas — sessão cookie tradicional ficaria mais complexa.
- Access token curto reduz janela de abuso.
- Refresh token permite renovar a sessão sem novo login.
- Encaixa bem em API REST + SPA.

## Como está sendo usado neste projeto?

Componentes:

| Peça | Função |
|------|--------|
| `JwtService` | Cria/valida access e refresh; revoga refresh em logout |
| `JwtProperties` | Segredo e tempos via env (`JWT_SECRET`, etc.) |
| `JwtAuthenticationFilter` | Lê Bearer e autentica o request |
| `AuthController` / `AuthService` | `/auth/login`, `/auth/refresh`, `/auth/logout` |

Tipos de token (claim `type`):

- `ACCESS` — curto (padrão 30 min)
- `REFRESH` — longo (padrão 7 dias)

Fluxo no frontend:

1. Admin autentica em `/admin/login`.
2. Tokens ficam no `sessionStorage`.
3. Axios adiciona o access token automaticamente.
4. Em `401`, tenta refresh uma vez; se falhar, redireciona para `/admin/login`.
5. Logout chama a API e descarta tokens locais; o refresh usado entra em denylist em memória no backend.

Importante para entrevista:

- Access token revogado no logout **não** é invalidado no servidor (ele expira sozinho).
- Refresh revogado em memória serve para MVP single-instance; em escala multi-instância, a denylist deveria ir para Redis/banco.
