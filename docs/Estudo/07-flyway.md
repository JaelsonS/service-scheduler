# 07 — Flyway

## O que é?

**Flyway** é uma ferramenta de migração versionada de banco de dados.

Cada alteração de schema fica em um arquivo SQL numerado (`V1__...`, `V2__...`). Na subida da aplicação, o Flyway aplica apenas as migrations ainda não executadas e registra o histórico em `flyway_schema_history`.

## Por que usamos?

- Schema reproduzível entre local, Supabase e produção.
- Histórico auditável das mudanças.
- Evitar `ddl-auto=update/create`, que é arriscado em produção.
- Permitir seeds controlados (serviços iniciais, tabelas novas).

Esta é a decisão do ADR-003: PostgreSQL + Flyway + `ddl-auto=validate`.

## Como está sendo usado neste projeto?

Local dos scripts:

```text
backend/src/main/resources/db/migration/
  V1__create_initial_schema.sql
  V2__seed_services.sql
  V3__create_admin_users.sql
```

| Migration | Conteúdo |
|-----------|----------|
| V1 | Tabelas `services` e `appointments`, FKs, checks, índices e índice único parcial de horário ativo |
| V2 | Seed de serviços para o cliente conseguir agendar |
| V3 | Tabela `admin_users` para autenticação administrativa |

Configuração:

```properties
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=3
```

O `baseline` existe para ambientes em que o schema já foi provisionado (ex.: Supabase) sem histórico Flyway local — evita tentar recriar tabelas existentes.

Fluxo na prática:

```text
App sobe → Flyway aplica migrations pendentes → Hibernate valida entities → API fica pronta
```
