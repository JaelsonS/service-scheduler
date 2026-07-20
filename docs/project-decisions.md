# Decisões do Projeto

## Objetivo

Este documento consolida as decisões técnicas tomadas para o Service Scheduler durante o desafio técnico do DevClub.

O projeto foi desenvolvido em sete dias. O objetivo não é construir a aplicação mais complexa possível, mas entregar uma solução sólida, organizada, performática e alinhada aos requisitos apresentados.

As decisões foram tomadas considerando:

- requisitos funcionais do desafio;
- prazo disponível;
- simplicidade adequada ao problema;
- manutenibilidade;
- performance proporcional ao volume esperado;
- facilidade de testes;
- possibilidade de evolução;
- risco técnico e operacional.

## Escopo funcional escolhido

### Cliente

O cliente poderá:

- agendar um serviço **sem login** (fluxo mínimo do desafio);
- informar nome, telefone, serviço, data e horário;
- consultar horários disponíveis;
- deixar de selecionar horários ocupados;
- visualizar uma confirmação;
- **opcionalmente** criar conta (e-mail + senha), ver e cancelar os próprios agendamentos.

### Administrador

O administrador poderá:

- listar agendamentos;
- visualizar os dados dos clientes;
- filtrar por data e buscar por nome/telefone;
- consultar resumo do dia por status;
- alterar status;
- cancelar agendamentos;
- excluir agendamentos.

Os status previstos são `AGENDADO`, `CONFIRMADO`, `CONCLUIDO` e `CANCELADO`.

## Stack adotada

### Backend

O backend utiliza Java 25, Spring Boot 4, Maven, Spring Web, Spring Data JPA, Bean Validation, Lombok e PostgreSQL no Supabase.

Spring Boot e Spring Data JPA foram escolhidos por atenderem rapidamente aos requisitos REST e de persistência, mantendo uma estrutura conhecida, testável e adequada ao prazo.

### Frontend

O frontend utiliza React, Vite, TypeScript, Tailwind CSS, Axios, React Hook Form e Zod.

React e Vite oferecem uma base simples para separar a área do cliente da área administrativa. TypeScript reduz erros de contrato, enquanto React Hook Form e Zod organizam a validação dos formulários.

### Deploy

- frontend na Vercel;
- backend no Render;
- PostgreSQL no Supabase.

Essa combinação reduz o trabalho operacional e permite entregar uma aplicação acessível publicamente sem criar infraestrutura própria.

## Organização do backend

O backend está organizado por responsabilidade:

```text
controller
service
repository
entity
dto
exception
validation
config
enums
utils
```

### Regras de dependência

- controllers não acessam repositories diretamente;
- regras de negócio ficam na camada `service`;
- repositories concentram acesso ao banco;
- entidades não são retornadas pela API;
- DTOs definem entrada e saída;
- exceções são tratadas de forma centralizada;
- `utils` não será utilizado como depósito de regras de negócio.

Essa organização aplica separação de responsabilidades, coesão e baixo acoplamento sem introduzir a complexidade de uma Clean Architecture completa ou de microsserviços.

## Modelo de dados

O MVP tem as entidades `Service` e `Appointment`.

`Service` representa o serviço oferecido ao cliente e possui nome, duração em minutos, indicador de atividade e timestamps. `Appointment` referência `Service` por `ManyToOne`, evitando armazenar o nome do serviço como texto duplicado e garantindo integridade referencial.

Essa decisão adiciona uma tabela e uma relação, mas o custo é proporcional ao domínio: o serviço é uma informação central do agendamento. O cadastro administrativo completo de serviços, preços e regras avançadas permanece fora do MVP.

## Persistência

O schema é gerenciado com Flyway. O Hibernate está configurado para validar o schema com `ddl-auto=validate`.

Não são utilizados `ddl-auto=create` ou `ddl-auto=update`, pois esses modos podem causar alterações imprevisíveis, perda de dados ou divergência entre ambientes.

As migrations são versionadas junto com o código e deverão ser aplicadas de maneira reproduzível em desenvolvimento, testes e produção.

## API

A API é REST e versionada com o prefixo `/api/v1`.

Todos os endpoints deverão:

- usar DTOs;
- validar entradas;
- retornar `ResponseEntity`;
- delegar regras para services;
- retornar erros em formato padronizado;
- evitar expor detalhes internos da persistência.

O tratamento global utiliza `@RestControllerAdvice` para converter erros de validação, conflitos, recursos inexistentes e falhas inesperadas em respostas consistentes.

## Performance

Performance é tratada desde o início, mas sem otimização prematura.

As práticas adotadas são:

- paginação na listagem administrativa;
- filtros executados no banco;
- consultas específicas;
- DTOs de resposta;
- índices para data, horário e status;
- relacionamentos `LAZY` quando existirem;
- prevenção de `N+1`;
- transações curtas;
- nenhuma consulta ou carga de dados sem necessidade.

O banco também deverá proteger a integridade do horário. A verificação feita no service melhora a experiência do usuário, mas uma constraint ou indice adequado deverá impedir reservas duplicadas em condições de concorrência.

## Validação e regras de negócio

Validações de formato serão feitas com Bean Validation no backend e Zod no frontend. As regras de negócio ficam no service, incluindo:

- campos obrigatórios;
- formato de telefone;
- data e horário validos;
- disponibilidade;
- impedimento de conflito;
- transições validas de status;
- cancelamento e exclusão.

O frontend melhora a experiência, mas nunca é a única camada de validação. O backend permanece responsável pela integridade e pelas regras de negócio.

## Segurança

A entrega inclui autenticação com Spring Security e JWT (access + refresh) em dois papéis:

- `ADMIN` — painel `/api/v1/admin/**`;
- `CLIENT` — área `/api/v1/client/**` (cadastro/login públicos; restante autenticado).

O fluxo de agendamento público (`POST /api/v1/appointments`) permanece aberto. Se o request trouxer Bearer `CLIENT` válido, o agendamento é associado ao `client_user_id` (coluna nullable), preservando agendamentos anônimos.

Credenciais iniciais do admin são criadas via bootstrap a partir de variáveis de ambiente. Segredos ficam fora do repositório (`.env` local / painel do Render).

Evoluções recomendadas: store distribuída de refresh tokens, auditoria e rotação automática de chaves JWT.

## Testes

O projeto valida as regras a cada etapa:

- testes das regras de negócio;
- testes de repository quando a persistência estiver pronta;
- testes HTTP dos controllers;
- validação de erros e contratos;
- testes do fluxo principal de disponibilidade e agendamento.

Testes de carga, concorrência avançada e Testcontainers são evoluções recomendadas, mas não serão obrigatórios para a primeira entrega devido ao prazo.

## Decisões de escopo

### Cliente autenticado opcional (híbrido)

O desafio exige agendamento público. Optamos por **manter esse fluxo** e, em paralelo, oferecer conta de cliente opcional. Motivos:

1. não quebra o requisito mínimo;
2. demonstra JWT multi-papel de forma clara para o recrutador;
3. custo controlado (mesma infra de auth do admin + entidade `ClientUser` + migration `V4`).

Fora do MVP desta entrega: CRUD completo de serviços no admin, profissionais, WhatsApp, CI/CD completo e multi-tenant.

Autenticação JWT do **admin** e do **cliente** (opcional) faz parte da entrega atual.

### Rate limiting e SEO (pós-MVP de estabilização)

Incluídos na preparação para produção:

- rate limiting in-memory por IP (auth e criação de agendamento), adequado a instância única no Render;
- meta tags / Open Graph / `robots.txt` / `sitemap.xml` e componente `SeoHead` por rota;
- CORS sem padrão `*` — apenas localhost, `*.vercel.app` e origens via env.

Isso não significa que os itens fora de escopo sejam irrelevantes. Significa que foram comparados com o valor para os requisitos do desafio e com o custo de implementação. A escolha foi priorizar um fluxo principal completo, testado e documentado, com demo publica (Render + Vercel).

## Critérios para evolução

Uma nova funcionalidade deve ser considerada quando:

1. houver requisito real ou evidência de necessidade;
2. o impacto no modelo de dados estiver compreendido;
3. houver estratégia de testes;
4. a segurança e a privacidade forem avaliadas;
5. o custo operacional for aceitável;
6. a alteração não comprometer os contratos existentes sem versionamento.

## Referência detalhada

As decisões no formato de contexto, alternativas, justificativa e trade-offs estao registradas em [architecture-decisions.md](architecture-decisions.md).