# Decisões do projeto (AgendaPro)

Resumo do que eu entreguei no desafio DevClub e do que deixei de fora de propósito.

## Objetivo

Em ~7 dias: agendar serviço sem conflito de horário, painel admin autenticado, UI responsiva, demo pública.  
Prioridade: fluxo principal sólido — não a stack mais complexa possível.

## Escopo funcional

### Visitante (sem login)

- ver serviços e horários livres  
- agendar (nome, telefone, serviço, data, hora)  
- ver confirmação  

### Cliente (opcional)

- cadastro / login  
- “Minha conta”: listar e cancelar os próprios  
- se agendar logado, o appointment liga em `client_user_id`  

### Admin

- listar / filtrar / buscar  
- resumo do dia  
- mudar status, cancelar, excluir  
- status: `AGENDADO`, `CONFIRMADO`, `CONCLUIDO`, `CANCELADO`  

## Stack

| Camada | Escolha |
|--------|---------|
| Backend | Java 25, Spring Boot 4, JPA, Security, Flyway, jjwt |
| Frontend | React 19, Vite, TypeScript, Tailwind, Axios, RHF, Zod |
| Banco | PostgreSQL (Supabase) |
| Deploy | Backend Render · Frontend Vercel |

## Modelo de dados

Entidades: `Service`, `Appointment`, `AdminUser`, `ClientUser`.  
`Appointment.service` é `ManyToOne`. `client_user_id` é nullable (guest agenda sem conta).

## Persistência

Flyway versiona schema (`V1`–`V4`). Hibernate: `ddl-auto=validate`.  
Índice único parcial protege o horário em concorrência.

## API

Prefixo `/api/v1`. DTOs + Bean Validation + `@RestControllerAdvice`.  
Público: services, availability, criar appointment, auth.  
Protegido: `/admin/**` (ADMIN), `/client/**` (CLIENT) — auth de cliente é público.

## Segurança (MVP)

- JWT access + refresh  
- BCrypt nas senhas  
- CORS sem `*` (localhost, Vercel, env)  
- Rate limit in-memory por IP (auth + create)  
- Swagger off em prod  
- Credencial admin demo no README (só pra avaliador)  

Melhorias óbvias depois: Redis pra refresh/rate limit, menos PII no GET público de confirmação.

## Testes

Unitários / MockMvc nas regras principais (status, auth, slots, rate limit).  
Sem Testcontainers neste prazo — admito e cito como próximo passo.

## Fora do MVP (de propósito)

CRUD admin de serviços, profissionais, WhatsApp, multi-tenant, CI/CD completo, overlap real por duração do serviço.

## Critério pra evoluir

Só adiciono feature se tiver requisito claro, impacto no schema entendido, e caminho de teste — sem inflar o desafio.

## Detalhe arquitetural

[architecture-decisions.md](architecture-decisions.md)
