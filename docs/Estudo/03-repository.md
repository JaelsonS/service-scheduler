# 03 — Repository

## O que é?

O **Repository** é a abstração de acesso a dados.

Com Spring Data JPA, uma interface que estende `JpaRepository<Entity, Id>` ganha operações prontas (`save`, `findById`, `delete`, paginação) e permite declarar consultas por nome de método ou com `@Query` / `@EntityGraph`.

## Por que usamos?

- Isolar SQL/JPQL da regra de negócio.
- Evitar código repetido de CRUD.
- Expressar consultas específicas do domínio de forma tipada.
- Facilitar troca/mock em testes.

O repository responde *como buscar/salvar dados*; o service responde *quando e por quê*.

## Como está sendo usado neste projeto?

| Repository | Entidade | Uso principal |
|------------|----------|---------------|
| `AppointmentRepository` | `Appointment` | Conflitos, disponibilidade, detalhe com serviço, listagem filtrada/paginada |
| `ServiceRepository` | `Service` | Serviços ativos e busca por id |
| `AdminUserRepository` | `AdminUser` | Autenticação administrativa |

Consultas relevantes em `AppointmentRepository`:

- `findByIdWithService` — carrega o agendamento com o serviço (`@EntityGraph`) para evitar lazy load fora da transação.
- `findAllFiltered` — listagem admin com filtro opcional por data + paginação.
- `findOccupiedTimesByDate` — horários ocupados (exceto `CANCELADO`) para montar disponibilidade.
- `existsByAppointmentDateAndAppointmentTimeAndStatusNot` — checagem preventiva de conflito.

A proteção final contra concorrência não depende só do repository: existe também um **índice único parcial** no PostgreSQL (`uq_appointments_active_schedule`).
