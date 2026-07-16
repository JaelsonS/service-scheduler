# Service Scheduler

Aplicacao full stack de agendamento de servicos desenvolvida para o desafio tecnico do DevClub.

O projeto prioriza codigo limpo, separacao de responsabilidades, validacao de dados, persistencia confiavel e uma experiencia simples para clientes e administradores. A arquitetura foi dimensionada para o prazo de sete dias e para os requisitos reais do desafio, evitando abstracoes que nao agregariam valor ao MVP.

## Escopo do MVP

### Area do cliente

- Criar um agendamento informando nome, telefone, servico, data e horario;
- Consultar horarios disponiveis;
- Impedir a selecao de horarios ocupados;
- Visualizar a confirmacao do agendamento.

### Area administrativa

- Listar agendamentos;
- Visualizar os dados dos clientes;
- Filtrar agendamentos por data;
- Alterar o status do atendimento;
- Cancelar ou excluir agendamentos.

Status suportados:

- `AGENDADO`
- `CONFIRMADO`
- `CONCLUIDO`
- `CANCELADO`

## Stack

### Backend

- Java 25;
- Spring Boot 4;
- Maven;
- Spring Web;
- Spring Data JPA;
- Bean Validation;
- Lombok;
- PostgreSQL hospedado no Supabase;
- Flyway para versionamento do schema.

### Frontend

- React;
- Vite;
- TypeScript;
- Tailwind CSS;
- Axios;
- React Hook Form;
- Zod.

### Deploy

- Frontend: Vercel;
- Backend: Render;
- Banco de dados: Supabase.

## Arquitetura

O backend utiliza uma arquitetura em camadas, organizada por responsabilidade:

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

O fluxo principal de uma requisicao e:

```text
Controller -> Service -> Repository -> PostgreSQL
```

### Responsabilidades

- `controller`: recebe requisicoes, delega para a camada de servico e monta respostas HTTP;
- `service`: concentra regras de negocio e controle transacional;
- `repository`: abstrai o acesso aos dados;
- `entity`: representa o modelo persistido;
- `dto`: define os contratos de entrada e saida da API;
- `exception`: concentra excecoes de negocio e o tratamento global;
- `validation`: contem validacoes que nao devem ficar no controller;
- `config`: centraliza configuracoes de infraestrutura;
- `enums`: representa valores fechados do dominio;
- `utils`: contem apenas utilitarios realmente compartilhados.

Controllers nao acessam repositories diretamente e entidades JPA nunca sao retornadas pela API. Todas as respostas utilizam DTOs e `ResponseEntity`.

Esta aplicacao nao utiliza Clean Architecture completa, Ports and Adapters ou uma estrutura de microsservicos. Essas abordagens sao validas para sistemas maiores, mas adicionariam complexidade desnecessaria ao escopo e ao prazo deste desafio. A separacao em camadas permite manter baixo acoplamento e deixa uma futura evolucao possivel sem antecipar problemas que o MVP ainda nao possui.

## Modelagem do MVP

O MVP possui as entidades `Service` e `Appointment`.

`Service` representa um servico oferecido e armazena nome, duracao em minutos, situacao de atividade e timestamps. `Appointment` referencia um `Service` por relacionamento `ManyToOne`, evitando duplicar o nome do servico e mantendo integridade referencial.

O modelo inicial foi mantido pequeno, mas representa corretamente o dominio. A duracao ja fica preparada para evolucoes de disponibilidade, enquanto o cadastro completo de servicos permanece fora do escopo de telas administrativas do MVP.

## Persistencia e performance

- PostgreSQL e utilizado como banco relacional;
- Flyway gerencia todas as alteracoes do schema;
- `spring.jpa.hibernate.ddl-auto=validate` sera utilizado;
- `create` e `update` nao serao utilizados;
- consultas administrativas terao paginacao;
- endpoints retornarao DTOs especificos;
- filtros serao executados no banco;
- indices serao criados para os campos usados em data, horario e status;
- relacionamentos futuros deverao ser `LAZY` por padrao;
- consultas serao projetadas para evitar `N+1` e carregamento de dados sem necessidade;
- transacoes serao curtas e aplicadas somente nos casos de uso que alteram dados.

O banco tambem sera responsavel por garantir a unicidade do horario ocupado. A verificacao na camada de servico melhora a mensagem para o usuario, mas nao substitui a protecao contra duas requisicoes concorrentes.

## API

A API sera versionada sob:

```text
/api/v1
```

Todos os endpoints deverao:

- receber e retornar DTOs;
- validar dados de entrada;
- utilizar `ResponseEntity`;
- retornar erros em formato padronizado;
- delegar regras de negocio para a camada `service`.

Endpoints previstos:

```text
POST   /api/v1/appointments
GET    /api/v1/appointments/{id}
GET    /api/v1/appointments/availability
GET    /api/v1/admin/appointments
PATCH  /api/v1/admin/appointments/{id}/status
POST   /api/v1/admin/appointments/{id}/cancel
DELETE /api/v1/admin/appointments/{id}
```

## Seguranca no MVP

JWT e autenticacao administrativa nao serao implementados nesta primeira versao, pois nao fazem parte dos requisitos obrigatorios do desafio.

Mesmo assim, a estrutura sera preparada para uma evolucao posterior:

- controllers administrativos ficarao separados dos controllers publicos;
- regras de negocio nao dependerao de autenticacao;
- configuracoes sensiveis serao fornecidas por variaveis de ambiente;
- CORS sera configurado por ambiente;
- erros internos nao serao expostos ao cliente;
- logs nao deverao registrar dados pessoais completos.

Em uma versao de producao, deverao ser avaliados autenticacao, autorizacao por perfil, rate limiting, auditoria de alteracoes e protecoes adicionais para dados pessoais.

## Melhorias possiveis fora do MVP

O projeto poderia ser mais robusto e completo com:

- entidade `Service` com catalogo dinamico;
- duracao, preco e disponibilidade por servico;
- entidade de profissional, sala ou recurso de atendimento;
- multiplos calendarios e regras de horario comercial;
- autenticacao e autorizacao administrativa;
- notificacoes por e-mail ou WhatsApp;
- lembretes automaticos;
- reagendamento;
- historico de alteracoes e auditoria;
- soft delete;
- idempotencia na criacao de agendamentos;
- filas para processamento assincrono;
- cache de horarios disponiveis;
- observabilidade com metricas, logs estruturados e tracing;
- testes de carga e testes de concorrencia;
- Testcontainers para testes com PostgreSQL real;
- pipeline de CI/CD com verificacao automatica;
- OpenAPI/Swagger;
- LGPD, politica de retencao e anonimacao de dados.

Essas funcionalidades nao serao antecipadas porque aumentariam a superficie tecnica sem serem necessarias para demonstrar os requisitos avaliados no desafio. Elas ficam registradas como direcao de evolucao, e nao como divida tecnica acidental.

## Etapas de desenvolvimento

### Etapa 1: fundacao

- higienizar artefatos do projeto;
- configurar `.gitignore`;
- configurar Flyway;
- configurar PostgreSQL;
- separar configuracoes de desenvolvimento e producao.

### Etapa 2: persistencia

- criar a migracao inicial;
- modelar `Appointment`;
- criar `AppointmentStatus`;
- adicionar constraints e indices necessarios.

### Etapa 3: regras de negocio

- criar repository;
- implementar service;
- validar disponibilidade;
- impedir conflitos de horario;
- implementar alteracoes de status;
- testar as regras de negocio.

### Etapa 4: API

- criar controllers REST;
- criar tratamento global com `@RestControllerAdvice`;
- documentar contratos;
- criar testes HTTP.

### Etapa 5: frontend

- configurar React, Vite, TypeScript e Tailwind;
- criar a area do cliente;
- criar a area administrativa;
- integrar a API;
- validar responsividade e estados de loading, erro e sucesso.

Cada etapa sera explicada, implementada e validada antes do inicio da etapa seguinte.

## Execucao local

As instrucoes completas de configuracao do banco, variaveis de ambiente, backend e frontend serao adicionadas conforme cada etapa for implementada.

## Uso de Inteligencia Artificial

A Inteligencia Artificial sera utilizada como ferramenta de apoio para:

- analisar requisitos;
- revisar decisoes arquiteturais;
- propor e revisar implementacoes;
- auxiliar na criacao de testes;
- identificar riscos e melhorias;
- apoiar a documentacao.

As decisoes finais, revisoes, testes e validacao do comportamento permanecem sob responsabilidade do desenvolvedor.
