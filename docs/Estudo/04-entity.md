# 04 — Entity

## O que é?

A **Entity** é a representação Java de uma tabela do banco.

Com JPA/Hibernate, classes anotadas com `@Entity` e `@Table` mapeiam colunas, chaves, relacionamentos e, quando necessário, callbacks de ciclo de vida (`@PrePersist`, `@PreUpdate`).

Entity = modelo persistido. Não é contrato da API.

## Por que usamos?

- Garantir integridade referencial e tipagem forte no domínio persistido.
- Usar o mapeamento objeto-relacional do JPA.
- Separar o modelo de armazenamento do modelo exposto ao frontend (DTO).

Expor entity diretamente na API costuma gerar problemas de serialização, lazy loading e vazamento de detalhes internos.

## Como está sendo usado neste projeto?

Entidades do MVP:

| Entity | Tabela | Observação |
|--------|--------|------------|
| `Service` | `services` | Catálogo de serviços (nome, duração, ativo) |
| `Appointment` | `appointments` | Agendamento do cliente |
| `AdminUser` | `admin_users` | Credenciais administrativas |

Pontos de modelagem:

- `Appointment.service` é `@ManyToOne(fetch = LAZY)` — carrega o serviço sob demanda.
- Status é o enum `AppointmentStatus` mapeado como `STRING`.
- `createdAt` / `updatedAt` são preenchidos em `@PrePersist` / `@PreUpdate`.
- A entity `Service` mantém o nome do domínio (ADR-002); o stereotype Spring usa FQCN `@org.springframework.stereotype.Service` para evitar conflito de nome.

Fluxo típico:

```text
DTO de entrada → Mapper cria/atualiza Entity → Repository salva → Mapper devolve DTO de saída
```
