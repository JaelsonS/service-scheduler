# 11 — Rate limiting e CORS

## O que é?

**Rate limiting** limita quantas requisições um cliente (aqui, por IP) pode fazer em uma janela de tempo.

**CORS (Cross-Origin Resource Sharing)** define quais origens de frontend podem chamar a API no browser.

## Por que usamos?

- Login e criação de agendamento são alvos fáceis de abuso em API pública.
- Frontend na Vercel e API no Render são origens diferentes — sem CORS correto o browser bloqueia.
- Em MVP single-instance (Render), contador em memória resolve sem Redis.

## Como está sendo usado neste projeto?

### Rate limiting

Peças:

| Peça | Função |
|------|--------|
| `RateLimitProperties` | Limites via env (`RATE_LIMIT_*`) |
| `RateLimitFilter` | Contador por IP + bucket (auth / appointments / default) |
| `RateLimitConfig` | Registra o filtro em `/api/*` sem poluir `@WebMvcTest` |

Janela fixa de 60 segundos. Defaults típicos:

- auth: 20 req/min
- criação de agendamento: 30 req/min
- demais: 120 req/min

Quando estoura: HTTP `429` + header `Retry-After: 60` + mensagem em português.

Health (`/actuator/health`) e Swagger ficam de fora do filtro.

### CORS

`CorsConfig` libera:

- `http://localhost:*` / `http://127.0.0.1:*`
- `https://*.vercel.app`
- origens extras em `CORS_ALLOWED_ORIGINS`

Não usamos `*` como padrão — evita abrir a API demais em produção.

### Para entrevista

- Rate limit in-memory **não** compartilha contadores entre várias réplicas.
- CORS não é autenticação: só controla o browser; Postman/curl ainda chegam na API.
- CSRF fica off porque não há cookie de sessão — o token vai no header `Authorization`.
