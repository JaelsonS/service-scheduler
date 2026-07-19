# 08 — Spring Security

## O que é?

**Spring Security** é o framework de autenticação e autorização do ecossistema Spring.

Ele intercepta requisições HTTP, decide quem pode acessar cada rota e integra mecanismos como senha criptografada, filtros e sessão (ou ausência dela).

## Por que usamos?

- Proteger a área administrativa sem reinventar filtros e criptografia.
- Separar claramente rotas públicas e privadas.
- Usar BCrypt para senha do admin.
- Preparar a API para evolução (roles, rate limit, auditoria).

No MVP do desafio, clientes agendam sem login. Admin precisa de proteção real antes do deploy.

## Como está sendo usado neste projeto?

Classe central: `SecurityConfig`.

Política adotada:

| Rota | Acesso |
|------|--------|
| `/api/v1/services/**` | Público |
| `/api/v1/appointments/**` | Público |
| `/api/v1/auth/**` | Público |
| `/actuator/health` | Público |
| Swagger (quando habilitado) | Público |
| `/api/v1/admin/**` | Autenticado com role `ADMIN` |
| Qualquer outra | Negado |

Características:

- sessão **STATELESS** (sem HttpSession);
- CSRF desabilitado (API JWT);
- CORS via `CorsConfigurationSource`;
- `PasswordEncoder` = `BCryptPasswordEncoder`;
- `AdminUserDetailsService` carrega o usuário admin do banco;
- `AdminUserBootstrap` cria o primeiro admin a partir de variáveis de ambiente se a tabela estiver vazia;
- erros 401/403 retornam o mesmo formato `ErrorResponseDTO` (`RestAuthenticationEntryPoint`, `RestAccessDeniedHandler`).

O filtro JWT entra na cadeia **antes** do filtro de username/password, convertendo o Bearer token em autenticação no contexto de segurança.
