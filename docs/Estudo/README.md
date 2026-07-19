# Estudo — Service Scheduler

Material de estudo baseado na arquitetura real deste projeto. Serve para revisão de entrevista (vaga júnior) e para explicar o “porquê” de cada camada.

**Não é documentação de produto incompleta** — o MVP está em `/backend` e `/frontend`. Estes arquivos são apoio de aprendizado.

Cada arquivo responde três perguntas:

1. **O que é?**
2. **Por que usamos?**
3. **Como está sendo usado neste projeto?**

## Índice

| # | Tema | Arquivo |
|---|------|---------|
| 01 | Controller | [01-controller.md](01-controller.md) |
| 02 | Service | [02-service.md](02-service.md) |
| 03 | Repository | [03-repository.md](03-repository.md) |
| 04 | Entity | [04-entity.md](04-entity.md) |
| 05 | DTO | [05-dto.md](05-dto.md) |
| 06 | JPA | [06-jpa.md](06-jpa.md) |
| 07 | Flyway | [07-flyway.md](07-flyway.md) |
| 08 | Spring Security | [08-spring-security.md](08-spring-security.md) |
| 09 | JWT | [09-jwt.md](09-jwt.md) |
| 10 | React | [10-react.md](10-react.md) |

## Fluxo mental do backend

```text
HTTP Request
    → Controller (entrada/saída HTTP)
    → Service (regra de negócio)
    → Repository (acesso a dados)
    → Entity / PostgreSQL
```

A API nunca devolve `Entity` diretamente: a conversão para `DTO` acontece nos mappers.
