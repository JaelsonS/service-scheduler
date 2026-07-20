# 08 — Spring Security

## O que é?

**Spring Security** é o framework de autenticação e autorização do ecossistema Spring.

Ele intercepta requisições HTTP, decide quem pode acessar cada rota e integra mecanismos como senha criptografada, filtros e sessão (ou ausência dela).

## Por que usamos?

- Proteger área administrativa e área do cliente autenticado sem reinventar filtros e criptografia.
- Separar claramente rotas públicas, `CLIENT` e `ADMIN`.
- Usar BCrypt para senhas.
- Manter API stateless com JWT (adequada a SPA + Render/Vercel).

No desafio, o agendamento público continua sem login. Conta de cliente é opcional; admin exige proteção real antes do deploy.

## Como está sendo usado neste projeto?

Classe central: `SecurityConfig`.

Política adotada:

| Rota | Acesso |
|------|--------|
| `/api/v1/services/**` | Público |
| `/api/v1/appointments/**` | Público |
| `/api/v1/auth/**` | Público (login admin / refresh / logout) |
| `/api/v1/client/auth/**` | Público (cadastro e login cliente) |
| `/actuator/health` | Público |
| Swagger (quando habilitado em dev) | Público |
| `/api/v1/admin/**` | Role `ADMIN` |
| `/api/v1/client/**` | Role `CLIENT` |
| Qualquer outra | Negado (`denyAll`) |

Características:

- sessão **STATELESS** (sem HttpSession);
- CSRF desabilitado (API JWT com Bearer — não há cookie de sessão);
- CORS via `CorsConfigurationSource` (localhost + `*.vercel.app` + env);
- headers de segurança (`X-Frame-Options: DENY`, content-type options);
- `PasswordEncoder` = `BCryptPasswordEncoder`;
- `AdminUserDetailsService` carrega o admin do banco;
- `AdminUserBootstrap` cria o primeiro admin a partir de env; em `prod` bloqueia credenciais padrão;
- erros 401/403 retornam `ErrorResponseDTO` em português (`RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`).

O filtro JWT entra na cadeia **antes** do filtro de username/password, convertendo o Bearer token em autenticação no contexto de segurança.

Rate limiting roda como filtro servlet separado (ver [11-rate-limit-cors.md](11-rate-limit-cors.md)).
