# Decisões Arquiteturais

## Contexto do projeto

O Service Scheduler é uma aplicação full stack de agendamento de serviços desenvolvida para um desafio técnico do DevClub. O prazo de desenvolvimento é de sete dias e os requisitos principais são:

- permitir que um cliente agende um serviço;
- consultar horários disponíveis;
- impedir a reserva de horários ocupados;
- permitir que um administrador consulte e gerencie agendamentos;
- persistir os dados;
- entregar uma interface responsiva;
- demonstrar organização, boas práticas e qualidade de código.

O objetivo arquitetural do projeto é entregar um MVP confiável, claro e manutenível, sem transformar um desafio de escopo definido em um sistema maior do que o necessário.

## Como interpretar estas decisões

Cada decisão registra o contexto que a motivou, as alternativas avaliadas, a escolha feita e os impactos esperados. Funcionalidades não implementadas não representam esquecimento: foram avaliadas e conscientemente adiadas para preservar a qualidade da entrega principal.

## ADR-001: Arquitetura em camadas

### Contexto

O backend precisa separar responsabilidades entre HTTP, regras de negócio e persistência, mantendo uma estrutura compreensível para uma equipe pequena e para um projeto com prazo curto.

### Problema

Colocar validações, consultas e regras de negócio diretamente nos controllers criaria alto acoplamento, dificultaria os testes e tornaria futuras alterações mais arriscadas.

### Opções consideradas

1. Arquitetura em camadas com `controller`, `service` e `repository`.
2. Clean Architecture completa com casos de uso, ports e adapters.
3. Microsserviços separados por domínio.
4. Implementação CRUD sem separação formal de responsabilidades.

### Decisão adotada

Utilizar arquitetura em camadas, organizada por responsabilidade:

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

### Justificativa técnica

A arquitetura em camadas oferece separação suficiente para aplicar SOLID e Clean Code sem introduzir uma quantidade desproporcional de abstrações. Controllers permanecem focados em HTTP, services concentram o negócio e repositories encapsulam o acesso ao banco.

### Benefícios

- baixo acoplamento entre entrada HTTP e persistência;
- regras de negócio testáveis sem depender dos controllers;
- estrutura fácil de compreender;
- menor custo de implementação e manutenção;
- possibilidade de adicionar segurança e novos endpoints sem reescrever o domínio atual.

### Trade-offs

- não existe isolamento completo do domínio em relação ao framework;
- algumas dependências entre camadas ainda serão permitidas;
- a estrutura não resolve sozinha problemas de modelagem ou de concorrência.

### Evolução futura

Se o sistema crescer, os módulos mais complexos poderão ser reorganizados gradualmente em uma abordagem hexagonal ou Clean Architecture. A evolução deverá ser motivada por necessidade real, e não apenas por formalidade arquitetural.

## ADR-002: Entidade Service no modelo inicial

### Contexto

O domínio do desafio envolve serviços oferecidos ao cliente. Mesmo que o gerenciamento completo do catálogo não seja um requisito da primeira entrega, o agendamento precisa referenciar o serviço escolhido.

### Problema

Armazenar o nome do serviço diretamente em `Appointment` permitiria inconsistências, duplicação de texto e dificultaria evoluções como duração e ativação do serviço.

### Opções consideradas

1. Armazenar o serviço como texto livre em `Appointment`.
2. Armazenar o serviço como enum fechado.
3. Criar `Service` como entidade relacionada a `Appointment`.
4. Criar também catálogo, profissionais e recursos de atendimento.

### Decisão adotada

Criar a entidade `Service` com `id`, `name`, `durationMinutes`, `active`, `createdAt` e `updatedAt`. A entidade `Appointment` terá `service` como relacionamento `ManyToOne` com carregamento `LAZY`. O status será representado pelo enum `AppointmentStatus`.

### Justificativa técnica

A entidade representa corretamente o domínio sem antecipar entidades de profissionais, recursos ou um catálogo administrativo completo. A relação fornece integridade referencial e deixa a duração pronta para futuras regras de disponibilidade.

### Benefícios

- integridade referencial;
- ausência de nomes de serviço duplicados nos agendamentos;
- duração pronta para evolução;
- possibilidade de ativar ou desativar serviços;
- modelo ainda pequeno e compreensível;
- menor risco de inconsistências de dados.

### Trade-offs

- ainda não haverá telas ou endpoints completos de gerenciamento de serviços;
- a relação adiciona uma tabela e um join nas consultas que exibirem dados do serviço;
- preço e regras avançadas de disponibilidade permanecem fora do MVP;
- a duração será persistida, mas não será usada por todas as regras nesta etapa.

### Evolução futura

Adicionar catálogo administrativo, preço, regras de disponibilidade e demais atributos quando houver necessidade real. Profissionais e recursos de atendimento serão modelados separadamente quando o domínio exigir mais de um recurso.

## ADR-003: PostgreSQL com Flyway

### Contexto

O sistema precisa persistir dados de agendamento de forma consistente e será hospedado utilizando PostgreSQL no Supabase.

### Problema

Alterações automaticas de schema podem gerar divergências entre ambientes e dificultar a reprodução do banco em desenvolvimento, testes e produção.

### Opções consideradas

1. PostgreSQL com `ddl-auto=create`.
2. PostgreSQL com `ddl-auto=update`.
3. PostgreSQL com migrations versionadas via Flyway.
4. Banco sem controle formal de schema.

### Decisão adotada

Utilizar PostgreSQL e Flyway para versionar o schema. O Hibernate será configurado com `ddl-auto=validate`, evitando que a aplicação altere a estrutura do banco automaticamente.

### Justificativa técnica

Flyway torna as alterações explicitas, auditáveis e reproduzíveis. O Hibernate pode validar se o mapeamento corresponde ao schema, mas não deve ser responsável por decidir alterações estruturais em produção.

### Benefícios

- schema reproduzível;
- histórico de migrações;
- maior segurança em deploys;
- detecção de divergências entre entidade e banco;
- suporte adequado ao ambiente Supabase.

### Trade-offs

- cada alteração persistente exige uma migration;
- a equipe precisa tratar migrations como parte do código;
- corrigir uma migration já aplicada exige uma nova migration.

### Evolução futura

Adicionar migrations para entidades de serviço, profissionais, recursos, auditoria e demais funcionalidades apenas quando entrarem no escopo aprovado.

## ADR-004: DTOs na fronteira da API

### Contexto

As entidades JPA representam persistência, enquanto a API representa contratos externos consumidos pelo frontend.

### Problema

Retornar entidades diretamente exporia detalhes internos, criaria dependência entre API e banco e poderia causar problemas de serialização, lazy loading e alterações involuntárias.

### Opções consideradas

1. Retornar entidades JPA diretamente.
2. Usar mapas genéricos em todas as respostas.
3. Criar DTOs de request e response.
4. Usar uma camada de mapeamento somente quando surgir um problema.

### Decisão adotada

Todos os endpoints receberão e retornarão DTOs. Entidades JPA nunca serão expostas diretamente. Mappers serão usados para converter entre DTOs e entidades.

### Justificativa técnica

DTOs permitem controlar exatamente os dados publicados, evoluir o contrato sem alterar o modelo persistido e evitar acoplamento com detalhes do JPA.

### Benefícios

- contratos explicitos;
- menor risco de vazamento de dados;
- respostas menores e mais performáticas;
- menor risco de `N+1` causado por serialização;
- facilidade para versionar a API.

### Trade-offs

- mais classes e conversões;
- necessidade de manter DTOs e mappers atualizados;
- maior volume inicial de código.

### Evolução futura

Adicionar DTOs de projeção específicos para listagens, disponibilidade e dashboards, evitando carregar colunas que não serão exibidas.

## ADR-005: Regras de negócio na camada Service

### Contexto

O agendamento possui regras que não podem ser reduzidas a uma operação simples de persistência: disponibilidade, conflitos e transições de status.

### Problema

Distribuir regras entre controllers, repositories e entidades de forma inconsistente provocaria duplicação e comportamentos diferentes conforme o endpoint utilizado.

### Opções consideradas

1. Concentrar regras nos controllers.
2. Espalhar regras entre controller e repository.
3. Concentrar regras de aplicação na camada `service`.
4. Criar uma estrutura completa de use cases e ports.

### Decisão adotada

A camada `service` será a proprietaria das regras de negócio e da orquestração das operações transacionais. Controllers apenas recebem, delegam e respondem.

### Justificativa técnica

Essa escolha atende ao escopo do MVP, mantem os métodos pequenos e permite testar o comportamento com mocks ou testes de integração sem acoplar a regra ao protocolo HTTP.

### Benefícios

- regras centralizadas;
- menor duplicação;
- testes unitarios mais simples;
- controllers previsíveis;
- facilidade para adicionar novos consumidores da mesma regra.

### Trade-offs

- services podem crescer se não houver disciplina;
- nem toda regra será automaticamente uma regra de entidade;
- a separação não substitui uma boa modelagem do domínio.

### Evolução futura

Extrair componentes de domínio ou casos de uso independentes caso a camada `service` passe a concentrar fluxos muito diferentes ou regras complexas.

## ADR-006: Disponibilidade e concorrência protegidas pelo banco

### Contexto

Dois clientes podem tentar reservar o mesmo horário simultaneamente. Verificar a disponibilidade antes de salvar não elimina uma condição de corrida.

### Problema

Uma validação somente na aplicação pode permitir duas reservas para o mesmo horário quando duas requisições consultam o banco antes de qualquer uma concluir o `INSERT`.

### Opções consideradas

1. Confiar somente na verificação feita pelo service.
2. Bloquear toda a agenda durante a operação.
3. Usar constraint ou indice de unicidade no PostgreSQL, combinado com validação na aplicação.
4. Usar fila para serializar todas as reservas.

### Decisão adotada

O service verificará conflitos para fornecer uma resposta clara ao cliente, e o PostgreSQL terá constraint ou indice adequado para proteger a integridade em concorrência. A exceção de violação será convertida em erro HTTP `409 Conflict`.

### Justificativa técnica

A aplicação oferece uma boa experiência e o banco permanece como última garantia de consistência. A solução evita locks amplos e filas desnecessárias para o volume esperado do desafio.

### Benefícios

- integridade dos dados mesmo sob concorrência;
- transações curtas;
- resposta clara para horário indisponível;
- comportamento previsível para futuras instâncias do backend.

### Trade-offs

- e necessário mapear a exceção de conflito;
- regras de disponibilidade mais avançadas podem exigir uma modelagem adicional;
- constraints de intervalo podem exigir recursos específicos do PostgreSQL.

### Evolução futura

Adicionar profissionais, salas ou recursos de atendimento e aplicar a regra de conflito por recurso. Para maior volume, avaliar idempotência, filas e estratégias de reserva temporária.

## ADR-007: API versionada e respostas padronizadas

### Contexto

O frontend será um consumidor separado do backend e a aplicação poderá evoluir depois do desafio.

### Problema

Alterar endpoints sem versionamento ou retornar erros em formatos diferentes aumenta o acoplamento e dificulta a manutenção do cliente.

### Opções consideradas

1. Endpoints sem versão.
2. Versionamento por header desde o início.
3. Versionamento explícito em `/api/v1`.
4. API GraphQL.

### Decisão adotada

Utilizar REST versionado em `/api/v1`, com DTOs, `ResponseEntity` e um formato comum de erro implementado por `@RestControllerAdvice`.

### Justificativa técnica

O versionamento na URL é simples de testar, fácil de compreender é suficiente para o desafio. Um formato padronizado reduz tratamento condicional no frontend.

### Benefícios

- contratos mais claros;
- evolução sem quebra imediata dos clientes;
- erros previsíveis;
- documentação mais objetiva.

### Trade-offs

- endpoints precisam ser mantidos durante uma transição de versão;
- o versionamento não substitui compatibilidade bem planejada;
- GraphQL e recursos mais avançados ficam fora do escopo.

### Evolução futura

Criar `/api/v2` somente diante de uma quebra de contrato real. Adicionar OpenAPI e validação automática de contratos quando a API crescer.

## ADR-008: JWT e Spring Security para a área administrativa

### Contexto

A entrega final exige que operações administrativas sejam protegidas, sem adicionar atrito ao fluxo público de agendamento.

### Problema

Os endpoints administrativos permitem consultar e alterar agendamentos. Expô-los sem autenticação não é adequado para uma entrega pronta para produção, enquanto autenticar os endpoints de reserva prejudicaria a experiência do cliente.

### Opções consideradas

1. Manter todos os endpoints públicos e proteger depois.
2. Usar uma senha fixa ou segredo no frontend.
3. Implementar sessão stateful para toda a API.
4. Implementar Spring Security com JWT somente na área administrativa.

### Decisão adotada

Adotar Spring Security stateless com JWT para `/api/v1/admin/**` (role `ADMIN`) e `/api/v1/client/**` (role `CLIENT`). O login e a renovação de token ficam em `/api/v1/auth` e `/api/v1/client/auth`, com access token de curta duração e refresh token. Endpoints de serviços, agendamento público, autenticação, health check e documentação (em dev) permanecem públicos.

### Justificativa técnica

A separação existente entre endpoints administrativos, de cliente e públicos permite adicionar segurança na fronteira HTTP sem alterar regras de negócio de agendamentos. JWT evita estado de sessão no servidor e BCrypt protege as credenciais. Rate limiting in-memory por IP cobre abuso básico em instância única.

### Benefícios

- área administrativa protegida por autenticação;
- conta de cliente opcional sem obrigar login no fluxo de reserva;
- respostas 401 e 403 padronizadas com o restante da API;
- configuração de credenciais e expirações por ambiente;
- proteção básica contra força bruta e spam de agendamentos.

### Trade-offs

- logout invalida refresh tokens em denylist em memória (access tokens seguem a expiração curta);
- rate limiting in-memory não compartilha contadores entre várias instâncias;
- rotação de refresh tokens e auditoria completa permanecem evoluções futuras.

### Evolução futura

Adicionar revogação persistida e rotação de refresh tokens, recuperação de senha, controle de acesso por perfis mais granulares, rate limiting distribuído e auditoria.

## ADR-009: Performance proporcional ao escopo

### Contexto

Mesmo com volume inicial pequeno, decisões simples de consulta podem criar problemas de performance e dificultar a evolução.

### Problema

Carregar listas sem limite, retornar entidades completas ou executar consultas repetidas pode gerar custo desnecessário e problemas de `N+1`.

### Opções consideradas

1. Priorizar somente velocidade de desenvolvimento.
2. Implementar cache, filas e otimização distribuída desde o início.
3. Usar consultas específicas, DTOs, filtros, paginação e índices adequados.

### Decisão adotada

Aplicar otimizações de baixo custo e alto valor: paginação administrativa, filtros no banco, DTOs específicos, índices para consultas frequentes, transações curtas e ausência de carregamento desnecessário.

### Justificativa técnica

Essas práticas previnem problemas comuns sem introduzir infraestrutura adicional. Cache, filas e particionamento não são necessarios para o volume esperado do desafio.

### Benefícios

- menor volume de dados transferidos;
- consultas mais previsíveis;
- menor consumo de memória;
- base técnica para crescimento gradual;
- código mais fácil de medir e otimizar.

### Trade-offs

- exige pensar nos contratos e consultas antes de implementar;
- pode demandar projections ou queries específicas;
- não substitui testes de carga quando o volume real crescer.

### Evolução futura

Adicionar cache, observabilidade, testes de carga, monitoramento e otimizações guiadas por métricas reais, evitando otimizar prematuramente.

## ADR-010: Escopo consciente de entrega

### Contexto

O projeto precisa ser entregue em sete dias e será avaliado principalmente por funcionamento, organização, experiência, responsividade, documentação e boas práticas.

### Problema

Adicionar funcionalidades sem priorização poderia reduzir a qualidade do fluxo principal, aumentar bugs e impedir uma entrega completa.

### Opções consideradas

1. Tentar implementar todas as funcionalidades de um sistema de produção.
2. Entregar um CRUD mínimo sem preocupação arquitetural.
3. Implementar integralmente os requisitos e registrar evoluções futuras.

### Decisão adotada

Entregar primeiro um MVP completo, testado e documentado, com arquitetura em camadas, validação, controle de conflitos, persistência versionada e separação entre cliente e administrador.

### Justificativa técnica

Qualidade e adequação ao problema são mais importantes do que quantidade de funcionalidades. A decisão demonstra capacidade de priorização e reduz risco técnico dentro do prazo.

### Benefícios

- maior probabilidade de entrega funcional;
- menor superfície de bugs;
- revisão e testes mais completos;
- documentação coerente com o que foi entregue;
- base clara para evolução.

### Trade-offs

- funcionalidades de produção permanecem fora da primeira versão;
- algumas decisões serão deliberadamente simples;
- o MVP não pretende representar todos os cenários de uma empresa real.

### Evolução futura

As funcionalidades adiadas deverão entrar por prioridade, impacto e evidências de uso, sempre acompanhadas de testes, migrações e revisão dos contratos.

## Funcionalidades planejadas para versões futuras

As funcionalidades abaixo poderiam tornar o sistema mais robusto e completo em um ambiente de produção. Elas não foram implementadas no MVP porque o desafio possui escopo definido e prazo limitado de sete dias. O adiamento foi consciente: priorizamos qualidade, organização, performance proporcional e entrega confiável dos requisitos obrigatórios.

### Segurança e acesso

- controle de acesso por perfis mais granulares;
- rotação e revogação persistida de refresh tokens;
- rate limiting distribuído (Redis) para múltiplas instâncias;
- auditoria completa de operações administrativas.

### Domínio e agenda

- cadastro completo de serviços;
- cadastro de profissionais;
- múltiplos recursos de atendimento;
- agenda configurável;
- horários personalizados;
- intervalos entre atendimentos;
- bloqueio de datas;
- feriados;
- cancelamento automático;
- soft delete.

### Comunicação e operação

- notificações por e-mail;
- notificações por WhatsApp;
- dashboard administrativo;
- logs estruturados;
- observabilidade;
- monitoramento.

### Plataforma e escala

- cache;
- Docker;
- CI/CD;
- testes de carga;
- internacionalização;
- multiempresa (Multi Tenant).

Cada item deverá ser avaliado novamente quanto a requisitos, custo, segurança, impacto no modelo de dados, operação e necessidade real antes de ser implementado.