# 03 — Repository

## O que é?

O **Repository** é a abstração de acesso a dados.

Com Spring Data JPA, uma interface que estende `JpaRepository<Entity, Id>` ganha operações prontas (`save`, `findById`, `delete`, paginação) e permite declarar consultas por nome de método ou com `@Query` / `@EntityGraph`.

## Por que usamos?

- Isolar SQL/JPQL da regra de negócio.
- Evitar código repetido de CRUD.
- Expressar consultas específicas do domínio de forma tipada.
- Facilitar troca/mock em testes.
- Mitigar SQL Injection: parâmetros bindados (prepared statements), sem concatenar SQL cru.

O repository responde *como buscar/salvar dados*; o service responde *quando e por quê*.

## Como está sendo usado neste projeto?

| Repository | Entidade | Uso principal |
|------------|----------|---------------|
| `AppointmentRepository` | `Appointment` | Conflitos, disponibilidade, detalhe com serviço, listagem filtrada/paginada, agendamentos do cliente |
| `ServiceRepository` | `Service` | Serviços ativos e busca por id |
| `AdminUserRepository` | `AdminUser` | Autenticação administrativa |
| `ClientUserRepository` | `ClientUser` | Cadastro/login do cliente e vínculo com agendamentos |

Consultas relevantes em `AppointmentRepository`:

- `findByIdWithService` — carrega o agendamento com o serviço (`@EntityGraph`) para evitar lazy load fora da transação.
- `findAllFiltered` — listagem admin com filtro opcional por data / busca `q` + paginação.
- `findOccupiedTimesByDate` — horários ocupados (exceto `CANCELADO`) para montar disponibilidade.
- `existsByAppointmentDateAndAppointmentTimeAndStatusNot` — checagem preventiva de conflito.
- `findAllByClientUserId` / `findByIdAndClientUserId` — área “minha conta”.

A proteção final contra concorrência não depende só do repository: existe também um **índice único parcial** no PostgreSQL (`uq_appointments_active_schedule` onde `status <> 'CANCELADO'`). Violação vira `409` via `GlobalExceptionHandler`.
