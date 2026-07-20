# 02 — Service

## O que é?

A camada **Service** concentra as regras de negócio e a orquestração dos casos de uso.

Ela decide *o que pode acontecer* no domínio (criar agendamento, validar horário, mudar status, autenticar admin/cliente), usando repositories e utilitários quando necessário.

No Spring, costuma ser marcada com `@Service` e pode usar `@Transactional` nas operações que alteram dados.

## Por que usamos?

- Evitar controllers “gordos” com regra de negócio.
- Reaproveitar a mesma lógica em múltiplos endpoints.
- Facilitar testes unitários com mocks de repository.
- Controlar transações no lugar certo (curtas e só quando necessário).

Em termos de SOLID: o service aplica **SRP** (um caso de uso por método, com responsabilidade clara) e mantém o controller desacoplado da persistência.

## Como está sendo usado neste projeto?

Principais services:

| Service | Papel |
|---------|--------|
| `AppointmentService` | Criar/consultar agendamentos, disponibilidade, listagem admin, status, cancelamento (admin e cliente) e exclusão |
| `ServiceCatalogService` | Listar serviços ativos e garantir que o serviço escolhido existe e está ativo |
| `AuthService` | Login admin, refresh e logout |
| `ClientAuthService` | Cadastro/login do cliente e carga de perfil ativo |
| `JwtService` | Criar, validar e revogar tokens JWT |
| `AdminUserDetailsService` | Carregar o admin para o Spring Security |

Regras importantes vivem no `AppointmentService`:

- não permitir data passada;
- não permitir horário passado no dia atual;
- validar horário comercial / slot (`AvailabilitySlotGenerator` + `BusinessHours`);
- impedir conflito de horário (checagem + índice único parcial no banco);
- se houver Bearer `CLIENT`, vincular o agendamento ao `ClientUser`;
- validar transições de status via `AppointmentStatusTransitionValidator`.

Máquina de estados:

```text
AGENDADO → CONFIRMADO | CANCELADO
CONFIRMADO → CONCLUIDO | CANCELADO
CONCLUIDO / CANCELADO → (finais)
```

Transações:

- métodos de leitura usam `@Transactional(readOnly = true)`;
- criação, update de status, cancelamento e delete usam `@Transactional`.

O service **não** conhece detalhes de HTTP. Ele lança exceções de negócio (`AppointmentConflictException`, `InvalidAppointmentTimeException`, etc.), e o handler global converte isso em JSON padronizado em português.
