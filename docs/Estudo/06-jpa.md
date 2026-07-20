# 06 — JPA

## O que é?

**JPA (Jakarta Persistence API)** é a especificação Java para mapeamento objeto-relacional.

Neste projeto usamos **Spring Data JPA + Hibernate** como implementação: entities, repositories, relacionamentos, queries JPQL e controle de schema via `ddl-auto`.

## Por que usamos?

- Produtividade para CRUD e consultas tipadas.
- Integração natural com Spring (transações, injeção, testes).
- Modelo relacional claro para agendamentos, serviços, admin e cliente.
- Compatibilidade com PostgreSQL/Supabase.

Alternativas (SQL puro, JDBC Template) são válidas, mas aumentariam o volume de código para o escopo do desafio.

## Como está sendo usado neste projeto?

Configuração importante em `application.properties`:

```properties
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
```

Significado prático:

- `validate` — o Hibernate **não cria/altera** tabelas; só confere se o mapeamento bate com o banco (Flyway manda no schema).
- `open-in-view=false` — evita lazy loading “escondido” durante a serialização HTTP; força carregamento explícito no service/repository.

Práticas aplicadas:

- relacionamentos `LAZY` por padrão;
- `@EntityGraph` quando precisamos do `service` junto do `appointment`;
- paginação na listagem administrativa;
- índices no SQL (Flyway) alinhados às consultas frequentes;
- timezone via `hibernate.jdbc.time_zone` / `APP_TIMEZONE` (`America/Sao_Paulo`);
- pool Hikari configurável (`DB_POOL_MAX_SIZE`, etc.) para o Render/Supabase.

Em resumo: JPA persiste e consulta; **Flyway versiona o schema**.
