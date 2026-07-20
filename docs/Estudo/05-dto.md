# 05 — DTO

## O que é?

**DTO (Data Transfer Object)** é um objeto usado para transportar dados entre camadas — especialmente na fronteira da API.

No projeto, DTOs são principalmente `record`s Java: imutáveis, explícitos e ideais para request/response JSON.

## Por que usamos?

- Controlar exatamente o que entra e sai da API.
- Evitar acoplar o frontend ao modelo JPA.
- Aplicar Bean Validation (`@NotBlank`, `@Size`, `@Pattern`, `@Email`, etc.) no contrato de entrada.
- Reduzir risco de N+1 e de expor campos sensíveis (ex.: hash de senha nunca sai).

Esta é a decisão registrada no ADR-004: **nunca retornar Entity diretamente**.

## Como está sendo usado neste projeto?

Pacotes principais:

```text
dto/appointment/   → create, response, list, availability, summary, status update
dto/service/       → ServiceResponseDTO
dto/auth/          → login, register cliente, refresh, token response, profile
dto/error/         → ErrorResponseDTO
```

Exemplos:

| DTO | Função |
|-----|--------|
| `AppointmentCreateRequestDTO` | Entrada do cliente para agendar |
| `AppointmentResponseDTO` | Resposta completa do agendamento |
| `AppointmentListResponseDTO` | Página administrativa / minha conta |
| `AvailabilityResponseDTO` | Slots livres de um dia |
| `AppointmentSummaryResponseDTO` | Cards de resumo por status (admin) |
| `LoginRequestDTO` / `AuthTokenResponseDTO` | Autenticação admin e cliente |
| `ClientRegisterRequestDTO` / `ClientProfileResponseDTO` | Cadastro e perfil do cliente |
| `ErrorResponseDTO` | Formato único de erro (`code`, `message`, `fieldErrors`) |

Mensagens de validação nos DTOs estão em **português** (ex.: `"Informe o nome"`, `"Telefone inválido"`) para o frontend exibir direto no toast/form.

Conversões ficam em mappers estáticos:

- `AppointmentMapper`
- `ServiceMapper`

Isso mantém controllers e services limpos e evita espalhar `new DTO(...)` por todo o código.
