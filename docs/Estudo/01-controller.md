# 01 — Controller

## O que é?

O **Controller** é a camada de entrada da API HTTP.

No Spring Boot, classes anotadas com `@RestController` recebem requisições, leem parâmetros/corpo JSON, delegam o trabalho para a camada de serviço e montam a resposta HTTP (`status`, headers e body).

Em uma frase: o controller fala a linguagem da web; ele não deve concentrar regra de negócio.

## Por que usamos?

- Separar protocolo HTTP da lógica de domínio (SRP).
- Padronizar contratos REST (`/api/v1`, DTOs, `ResponseEntity`).
- Facilitar testes HTTP (`@WebMvcTest`) sem precisar do banco.
- Deixar claro o que é público e o que é administrativo.

Sem controllers, a regra de negócio ficaria misturada com detalhes de servlet, JSON e status codes.

## Como está sendo usado neste projeto?

Organizamos controllers por fronteira:

| Controller | Prefixo | Responsabilidade |
|------------|---------|------------------|
| `AppointmentController` | `/api/v1/appointments` | Agendamento e disponibilidade do cliente |
| `ServiceController` | `/api/v1/services` | Listagem de serviços ativos |
| `AuthController` | `/api/v1/auth` | Login, refresh e logout |
| `AdminAppointmentController` | `/api/v1/admin/appointments` | Gestão administrativa |

Padrões adotados:

- Recebe e devolve **apenas DTOs**.
- Usa `@Valid` / Bean Validation na entrada.
- Delega tudo para `AppointmentService`, `ServiceCatalogService` ou `AuthService`.
- Retorna `ResponseEntity` com status adequado (`201 Created`, `204 No Content`, `200 OK`).

Exemplo mental do fluxo de criação:

```text
POST /api/v1/appointments
  → AppointmentController.create(@Valid DTO)
  → AppointmentService.create(...)
  → ResponseEntity.status(CREATED).body(AppointmentResponseDTO)
```

Erros de validação e negócio não são tratados manualmente em cada método: o `GlobalExceptionHandler` centraliza as respostas de erro.
