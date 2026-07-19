# Decisoes do Projeto

## Objetivo

Este documento consolida as decisoes tecnicas tomadas para o Service Scheduler durante o desafio tecnico do DevClub.

O projeto sera desenvolvido em sete dias. O objetivo nao e construir a aplicacao mais complexa possivel, mas entregar uma solucao solida, organizada, performatica e alinhada aos requisitos apresentados.

As decisoes foram tomadas considerando:

- requisitos funcionais do desafio;
- prazo disponivel;
- simplicidade adequada ao problema;
- manutenibilidade;
- performance proporcional ao volume esperado;
- facilidade de testes;
- possibilidade de evolucao;
- risco tecnico e operacional.

## Escopo funcional escolhido

### Cliente

O cliente podera:

- agendar um servico **sem login** (fluxo minimo do desafio);
- informar nome, telefone, servico, data e horario;
- consultar horarios disponiveis;
- deixar de selecionar horarios ocupados;
- visualizar uma confirmacao;
- **opcionalmente** criar conta (e-mail + senha), ver e cancelar os proprios agendamentos.

### Administrador

O administrador podera:

- listar agendamentos;
- visualizar os dados dos clientes;
- filtrar por data e buscar por nome/telefone;
- consultar resumo do dia por status;
- alterar status;
- cancelar agendamentos;
- excluir agendamentos.

Os status previstos sao `AGENDADO`, `CONFIRMADO`, `CONCLUIDO` e `CANCELADO`.

## Stack adotada

### Backend

O backend utilizara Java 25, Spring Boot 4, Maven, Spring Web, Spring Data JPA, Bean Validation, Lombok e PostgreSQL no Supabase.

Spring Boot e Spring Data JPA foram escolhidos por atenderem rapidamente aos requisitos REST e de persistencia, mantendo uma estrutura conhecida, testavel e adequada ao prazo.

### Frontend

O frontend utilizara React, Vite, TypeScript, Tailwind CSS, Axios, React Hook Form e Zod.

React e Vite oferecem uma base simples para separar a area do cliente da area administrativa. TypeScript reduz erros de contrato, enquanto React Hook Form e Zod organizam a validacao dos formularios.

### Deploy

- frontend na Vercel;
- backend no Render;
- PostgreSQL no Supabase.

Essa combinacao reduz o trabalho operacional e permite entregar uma aplicacao acessivel publicamente sem criar infraestrutura propria.

## Organizacao do backend

O backend sera organizado por responsabilidade:

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

### Regras de dependencia

- controllers nao acessam repositories diretamente;
- regras de negocio ficam na camada `service`;
- repositories concentram acesso ao banco;
- entidades nao sao retornadas pela API;
- DTOs definem entrada e saida;
- excecoes sao tratadas de forma centralizada;
- `utils` nao sera utilizado como deposito de regras de negocio.

Essa organizacao aplica separacao de responsabilidades, coesao e baixo acoplamento sem introduzir a complexidade de uma Clean Architecture completa ou de microsservicos.

## Modelo de dados

O MVP tera as entidades `Service` e `Appointment`.

`Service` representa o servico oferecido ao cliente e possui nome, duracao em minutos, indicador de atividade e timestamps. `Appointment` referencia `Service` por `ManyToOne`, evitando armazenar o nome do servico como texto duplicado e garantindo integridade referencial.

Essa decisao adiciona uma tabela e uma relacao, mas o custo e proporcional ao dominio: o servico e uma informacao central do agendamento. O cadastro administrativo completo de servicos, precos e regras avancadas permanece fora do MVP.

## Persistencia

O schema sera gerenciado com Flyway. O Hibernate sera configurado para validar o schema com `ddl-auto=validate`.

Nao serao utilizados `ddl-auto=create` ou `ddl-auto=update`, pois esses modos podem causar alteracoes imprevisiveis, perda de dados ou divergencia entre ambientes.

As migrations serao versionadas junto com o codigo e deverao ser aplicadas de maneira reproduzivel em desenvolvimento, testes e producao.

## API

A API sera REST e versionada com o prefixo `/api/v1`.

Todos os endpoints deverao:

- usar DTOs;
- validar entradas;
- retornar `ResponseEntity`;
- delegar regras para services;
- retornar erros em formato padronizado;
- evitar expor detalhes internos da persistencia.

O tratamento global utilizara `@RestControllerAdvice` para converter erros de validacao, conflitos, recursos inexistentes e falhas inesperadas em respostas consistentes.

## Performance

Performance sera tratada desde o inicio, mas sem otimizacao prematura.

As praticas adotadas serao:

- paginacao na listagem administrativa;
- filtros executados no banco;
- consultas especificas;
- DTOs de resposta;
- indices para data, horario e status;
- relacionamentos `LAZY` quando existirem;
- prevencao de `N+1`;
- transacoes curtas;
- nenhuma consulta ou carga de dados sem necessidade.

O banco tambem devera proteger a integridade do horario. A verificacao feita no service melhora a experiencia do usuario, mas uma constraint ou indice adequado devera impedir reservas duplicadas em condicoes de concorrencia.

## Validacao e regras de negocio

Validacoes de formato serao feitas com Bean Validation no backend e Zod no frontend. As regras de negocio ficarao no service, incluindo:

- campos obrigatorios;
- formato de telefone;
- data e horario validos;
- disponibilidade;
- impedimento de conflito;
- transicoes validas de status;
- cancelamento e exclusao.

O frontend melhora a experiencia, mas nunca sera a unica camada de validacao. O backend permanece responsavel pela integridade e pelas regras de negocio.

## Seguranca

A entrega inclui autenticacao com Spring Security e JWT (access + refresh) em dois papeis:

- `ADMIN` — painel `/api/v1/admin/**`;
- `CLIENT` — area `/api/v1/client/**` (cadastro/login publicos; restante autenticado).

O fluxo de agendamento publico (`POST /api/v1/appointments`) permanece aberto. Se o request trouxer Bearer `CLIENT` valido, o agendamento e associado ao `client_user_id` (coluna nullable), preservando agendamentos anonimos.

Credenciais iniciais do admin sao criadas via bootstrap a partir de variaveis de ambiente. Segredos ficam fora do repositorio (`.env` local / painel do Render).

Evolucoes recomendadas: rate limiting, store distribuida de refresh tokens, auditoria e rotacao automatica de chaves.

## Testes

O projeto devera validar cada etapa antes de avancar:

- testes das regras de negocio;
- testes de repository quando a persistencia estiver pronta;
- testes HTTP dos controllers;
- validacao de erros e contratos;
- testes do fluxo principal de disponibilidade e agendamento.

Testes de carga, concorrencia avancada e Testcontainers sao evolucoes recomendadas, mas nao serao obrigatorios para a primeira entrega devido ao prazo.

## Decisoes de escopo

### Cliente autenticado opcional (hibrido)

O desafio exige agendamento publico. Optamos por **manter esse fluxo** e, em paralelo, oferecer conta de cliente opcional. Motivos:

1. nao quebra o requisito minimo;
2. demonstra JWT multi-papel de forma clara para o recrutador;
3. custo controlado (mesma infra de auth do admin + entidade `ClientUser` + migration `V4`).

Fora do MVP desta entrega: CRUD completo de servicos no admin, profissionais, WhatsApp, CI/CD completo e multi-tenant.

Autenticacao JWT do **admin** e do **cliente** (opcional) faz parte da entrega atual.

Isso nao significa que os itens fora de escopo sejam irrelevantes. Significa que foram comparados com o valor para os requisitos do desafio e com o custo de implementacao. A escolha foi priorizar um fluxo principal completo, testado e documentado, com demo publica (Render + Vercel).

## Criterios para evolucao

Uma nova funcionalidade devera ser considerada quando:

1. houver requisito real ou evidencia de necessidade;
2. o impacto no modelo de dados estiver compreendido;
3. houver estrategia de testes;
4. a seguranca e a privacidade forem avaliadas;
5. o custo operacional for aceitavel;
6. a alteracao nao comprometer os contratos existentes sem versionamento.

## Referencia detalhada

As decisoes no formato de contexto, alternativas, justificativa e trade-offs estao registradas em [architecture-decisions.md](architecture-decisions.md).