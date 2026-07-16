# Decisoes Arquiteturais

## Contexto do projeto

O Service Scheduler e uma aplicacao full stack de agendamento de servicos desenvolvida para um desafio tecnico do DevClub. O prazo de desenvolvimento e de sete dias e os requisitos principais sao:

- permitir que um cliente agende um servico;
- consultar horarios disponiveis;
- impedir a reserva de horarios ocupados;
- permitir que um administrador consulte e gerencie agendamentos;
- persistir os dados;
- entregar uma interface responsiva;
- demonstrar organizacao, boas praticas e qualidade de codigo.

O objetivo arquitetural do projeto e entregar um MVP confiavel, claro e manutenivel, sem transformar um desafio de escopo definido em um sistema maior do que o necessario.

## Como interpretar estas decisoes

Cada decisao registra o contexto que a motivou, as alternativas avaliadas, a escolha feita e os impactos esperados. Funcionalidades nao implementadas nao representam esquecimento: foram avaliadas e conscientemente adiadas para preservar a qualidade da entrega principal.

## ADR-001: Arquitetura em camadas

### Contexto

O backend precisa separar responsabilidades entre HTTP, regras de negocio e persistencia, mantendo uma estrutura compreensivel para uma equipe pequena e para um projeto com prazo curto.

### Problema

Colocar validacoes, consultas e regras de negocio diretamente nos controllers criaria alto acoplamento, dificultaria os testes e tornaria futuras alteracoes mais arriscadas.

### Opcoes consideradas

1. Arquitetura em camadas com `controller`, `service` e `repository`.
2. Clean Architecture completa com casos de uso, ports e adapters.
3. Microsservicos separados por dominio.
4. Implementacao CRUD sem separacao formal de responsabilidades.

### Decisao adotada

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

### Justificativa tecnica

A arquitetura em camadas oferece separacao suficiente para aplicar SOLID e Clean Code sem introduzir uma quantidade desproporcional de abstracoes. Controllers permanecem focados em HTTP, services concentram o negocio e repositories encapsulam o acesso ao banco.

### Beneficios

- baixo acoplamento entre entrada HTTP e persistencia;
- regras de negocio testaveis sem depender dos controllers;
- estrutura facil de compreender;
- menor custo de implementacao e manutencao;
- possibilidade de adicionar seguranca e novos endpoints sem reescrever o dominio atual.

### Trade-offs

- nao existe isolamento completo do dominio em relacao ao framework;
- algumas dependencias entre camadas ainda serao permitidas;
- a estrutura nao resolve sozinha problemas de modelagem ou de concorrencia.

### Evolucao futura

Se o sistema crescer, os modulos mais complexos poderao ser reorganizados gradualmente em uma abordagem hexagonal ou Clean Architecture. A evolucao devera ser motivada por necessidade real, e nao apenas por formalidade arquitetural.

## ADR-002: Entidade Service no modelo inicial

### Contexto

O dominio do desafio envolve servicos oferecidos ao cliente. Mesmo que o gerenciamento completo do catalogo nao seja um requisito da primeira entrega, o agendamento precisa referenciar o servico escolhido.

### Problema

Armazenar o nome do servico diretamente em `Appointment` permitiria inconsistencias, duplicacao de texto e dificultaria evolucoes como duracao e ativacao do servico.

### Opcoes consideradas

1. Armazenar o servico como texto livre em `Appointment`.
2. Armazenar o servico como enum fechado.
3. Criar `Service` como entidade relacionada a `Appointment`.
4. Criar tambem catalogo, profissionais e recursos de atendimento.

### Decisao adotada

Criar a entidade `Service` com `id`, `name`, `durationMinutes`, `active`, `createdAt` e `updatedAt`. A entidade `Appointment` tera `service` como relacionamento `ManyToOne` com carregamento `LAZY`. O status sera representado pelo enum `AppointmentStatus`.

### Justificativa tecnica

A entidade representa corretamente o dominio sem antecipar entidades de profissionais, recursos ou um catalogo administrativo completo. A relacao fornece integridade referencial e deixa a duracao pronta para futuras regras de disponibilidade.

### Beneficios

- integridade referencial;
- ausencia de nomes de servico duplicados nos agendamentos;
- duracao pronta para evolucao;
- possibilidade de ativar ou desativar servicos;
- modelo ainda pequeno e compreensivel;
- menor risco de inconsistencias de dados.

### Trade-offs

- ainda nao havera telas ou endpoints completos de gerenciamento de servicos;
- a relacao adiciona uma tabela e um join nas consultas que exibirem dados do servico;
- preco e regras avancadas de disponibilidade permanecem fora do MVP;
- a duracao sera persistida, mas nao sera usada por todas as regras nesta etapa.

### Evolucao futura

Adicionar catalogo administrativo, preco, regras de disponibilidade e demais atributos quando houver necessidade real. Profissionais e recursos de atendimento serao modelados separadamente quando o dominio exigir mais de um recurso.

## ADR-003: PostgreSQL com Flyway

### Contexto

O sistema precisa persistir dados de agendamento de forma consistente e sera hospedado utilizando PostgreSQL no Supabase.

### Problema

Alteracoes automaticas de schema podem gerar divergencias entre ambientes e dificultar a reproducao do banco em desenvolvimento, testes e producao.

### Opcoes consideradas

1. PostgreSQL com `ddl-auto=create`.
2. PostgreSQL com `ddl-auto=update`.
3. PostgreSQL com migrations versionadas via Flyway.
4. Banco sem controle formal de schema.

### Decisao adotada

Utilizar PostgreSQL e Flyway para versionar o schema. O Hibernate sera configurado com `ddl-auto=validate`, evitando que a aplicacao altere a estrutura do banco automaticamente.

### Justificativa tecnica

Flyway torna as alteracoes explicitas, auditaveis e reproduziveis. O Hibernate pode validar se o mapeamento corresponde ao schema, mas nao deve ser responsavel por decidir alteracoes estruturais em producao.

### Beneficios

- schema reproduzivel;
- historico de migracoes;
- maior seguranca em deploys;
- deteccao de divergencias entre entidade e banco;
- suporte adequado ao ambiente Supabase.

### Trade-offs

- cada alteracao persistente exige uma migration;
- a equipe precisa tratar migrations como parte do codigo;
- corrigir uma migration ja aplicada exige uma nova migration.

### Evolucao futura

Adicionar migrations para entidades de servico, profissionais, recursos, auditoria e demais funcionalidades apenas quando entrarem no escopo aprovado.

## ADR-004: DTOs na fronteira da API

### Contexto

As entidades JPA representam persistencia, enquanto a API representa contratos externos consumidos pelo frontend.

### Problema

Retornar entidades diretamente exporia detalhes internos, criaria dependencia entre API e banco e poderia causar problemas de serializacao, lazy loading e alteracoes involuntarias.

### Opcoes consideradas

1. Retornar entidades JPA diretamente.
2. Usar mapas genericos em todas as respostas.
3. Criar DTOs de request e response.
4. Usar uma camada de mapeamento somente quando surgir um problema.

### Decisao adotada

Todos os endpoints receberao e retornarao DTOs. Entidades JPA nunca serao expostas diretamente. Mappers serao usados para converter entre DTOs e entidades.

### Justificativa tecnica

DTOs permitem controlar exatamente os dados publicados, evoluir o contrato sem alterar o modelo persistido e evitar acoplamento com detalhes do JPA.

### Beneficios

- contratos explicitos;
- menor risco de vazamento de dados;
- respostas menores e mais performaticas;
- menor risco de `N+1` causado por serializacao;
- facilidade para versionar a API.

### Trade-offs

- mais classes e conversoes;
- necessidade de manter DTOs e mappers atualizados;
- maior volume inicial de codigo.

### Evolucao futura

Adicionar DTOs de projecao especificos para listagens, disponibilidade e dashboards, evitando carregar colunas que nao serao exibidas.

## ADR-005: Regras de negocio na camada Service

### Contexto

O agendamento possui regras que nao podem ser reduzidas a uma operacao simples de persistencia: disponibilidade, conflitos e transicoes de status.

### Problema

Distribuir regras entre controllers, repositories e entidades de forma inconsistente provocaria duplicacao e comportamentos diferentes conforme o endpoint utilizado.

### Opcoes consideradas

1. Concentrar regras nos controllers.
2. Espalhar regras entre controller e repository.
3. Concentrar regras de aplicacao na camada `service`.
4. Criar uma estrutura completa de use cases e ports.

### Decisao adotada

A camada `service` sera a proprietaria das regras de negocio e da orquestracao das operacoes transacionais. Controllers apenas recebem, delegam e respondem.

### Justificativa tecnica

Essa escolha atende ao escopo do MVP, mantem os metodos pequenos e permite testar o comportamento com mocks ou testes de integracao sem acoplar a regra ao protocolo HTTP.

### Beneficios

- regras centralizadas;
- menor duplicacao;
- testes unitarios mais simples;
- controllers previsiveis;
- facilidade para adicionar novos consumidores da mesma regra.

### Trade-offs

- services podem crescer se nao houver disciplina;
- nem toda regra sera automaticamente uma regra de entidade;
- a separacao nao substitui uma boa modelagem do dominio.

### Evolucao futura

Extrair componentes de dominio ou casos de uso independentes caso a camada `service` passe a concentrar fluxos muito diferentes ou regras complexas.

## ADR-006: Disponibilidade e concorrencia protegidas pelo banco

### Contexto

Dois clientes podem tentar reservar o mesmo horario simultaneamente. Verificar a disponibilidade antes de salvar nao elimina uma condicao de corrida.

### Problema

Uma validacao somente na aplicacao pode permitir duas reservas para o mesmo horario quando duas requisicoes consultam o banco antes de qualquer uma concluir o `INSERT`.

### Opcoes consideradas

1. Confiar somente na verificacao feita pelo service.
2. Bloquear toda a agenda durante a operacao.
3. Usar constraint ou indice de unicidade no PostgreSQL, combinado com validacao na aplicacao.
4. Usar fila para serializar todas as reservas.

### Decisao adotada

O service verificara conflitos para fornecer uma resposta clara ao cliente, e o PostgreSQL tera constraint ou indice adequado para proteger a integridade em concorrencia. A excecao de violacao sera convertida em erro HTTP `409 Conflict`.

### Justificativa tecnica

A aplicacao oferece uma boa experiencia e o banco permanece como ultima garantia de consistencia. A solucao evita locks amplos e filas desnecessarias para o volume esperado do desafio.

### Beneficios

- integridade dos dados mesmo sob concorrencia;
- transacoes curtas;
- resposta clara para horario indisponivel;
- comportamento previsivel para futuras instancias do backend.

### Trade-offs

- e necessario mapear a excecao de conflito;
- regras de disponibilidade mais avancadas podem exigir uma modelagem adicional;
- constraints de intervalo podem exigir recursos especificos do PostgreSQL.

### Evolucao futura

Adicionar profissionais, salas ou recursos de atendimento e aplicar a regra de conflito por recurso. Para maior volume, avaliar idempotencia, filas e estrategias de reserva temporaria.

## ADR-007: API versionada e respostas padronizadas

### Contexto

O frontend sera um consumidor separado do backend e a aplicacao podera evoluir depois do desafio.

### Problema

Alterar endpoints sem versionamento ou retornar erros em formatos diferentes aumenta o acoplamento e dificulta a manutencao do cliente.

### Opcoes consideradas

1. Endpoints sem versao.
2. Versionamento por header desde o inicio.
3. Versionamento explicito em `/api/v1`.
4. API GraphQL.

### Decisao adotada

Utilizar REST versionado em `/api/v1`, com DTOs, `ResponseEntity` e um formato comum de erro implementado por `@RestControllerAdvice`.

### Justificativa tecnica

O versionamento na URL e simples de testar, facil de compreender e suficiente para o desafio. Um formato padronizado reduz tratamento condicional no frontend.

### Beneficios

- contratos mais claros;
- evolucao sem quebra imediata dos clientes;
- erros previsiveis;
- documentacao mais objetiva.

### Trade-offs

- endpoints precisam ser mantidos durante uma transicao de versao;
- o versionamento nao substitui compatibilidade bem planejada;
- GraphQL e recursos mais avancados ficam fora do escopo.

### Evolucao futura

Criar `/api/v2` somente diante de uma quebra de contrato real. Adicionar OpenAPI e validacao automatica de contratos quando a API crescer.

## ADR-008: Seguranca administrativa preparada, mas sem JWT no MVP

### Contexto

O desafio exige uma area administrativa, mas nao exige autenticacao ou autorizacao.

### Problema

Implementar um sistema completo de identidade em sete dias pode consumir tempo do fluxo principal, mas deixar os controllers administrativos misturados aos publicos dificultaria uma evolucao posterior.

### Opcoes consideradas

1. Nao fazer nenhuma separacao e proteger tudo futuramente.
2. Implementar Spring Security e JWT imediatamente.
3. Separar endpoints administrativos e manter a regra de negocio independente da autenticacao.
4. Usar uma senha fixa ou segredo no frontend.

### Decisao adotada

JWT e autenticacao nao serao implementados no MVP. Controllers administrativos serao separados dos publicos e nenhuma regra de negocio dependera de uma implementacao especifica de autenticacao.

### Justificativa tecnica

A decisao atende aos requisitos do desafio sem criar uma falsa sensacao de seguranca com credenciais improvisadas. A separacao de fronteiras permite incluir Spring Security posteriormente com impacto controlado.

### Beneficios

- mais tempo para entregar o fluxo funcional;
- menor superficie de codigo sensivel no MVP;
- facilidade de adicionar filtros de seguranca depois;
- regras de negocio desacopladas de identidade.

### Trade-offs

- a area administrativa nao sera apropriada para exposicao publica sem uma camada adicional de seguranca;
- o MVP nao atende requisitos de autenticacao de producao;
- sera necessaria uma etapa futura de revisao de autorizacao.

### Evolucao futura

Adicionar Spring Security, JWT ou sessao segura, controle de acesso por perfis, expiracao de credenciais, rate limiting e auditoria.

## ADR-009: Performance proporcional ao escopo

### Contexto

Mesmo com volume inicial pequeno, decisoes simples de consulta podem criar problemas de performance e dificultar a evolucao.

### Problema

Carregar listas sem limite, retornar entidades completas ou executar consultas repetidas pode gerar custo desnecessario e problemas de `N+1`.

### Opcoes consideradas

1. Priorizar somente velocidade de desenvolvimento.
2. Implementar cache, filas e otimizacao distribuida desde o inicio.
3. Usar consultas especificas, DTOs, filtros, paginacao e indices adequados.

### Decisao adotada

Aplicar otimizacoes de baixo custo e alto valor: paginacao administrativa, filtros no banco, DTOs especificos, indices para consultas frequentes, transacoes curtas e ausencia de carregamento desnecessario.

### Justificativa tecnica

Essas praticas previnem problemas comuns sem introduzir infraestrutura adicional. Cache, filas e particionamento nao sao necessarios para o volume esperado do desafio.

### Beneficios

- menor volume de dados transferidos;
- consultas mais previsiveis;
- menor consumo de memoria;
- base tecnica para crescimento gradual;
- codigo mais facil de medir e otimizar.

### Trade-offs

- exige pensar nos contratos e consultas antes de implementar;
- pode demandar projections ou queries especificas;
- nao substitui testes de carga quando o volume real crescer.

### Evolucao futura

Adicionar cache, observabilidade, testes de carga, monitoramento e otimizacoes guiadas por metricas reais, evitando otimizar prematuramente.

## ADR-010: Escopo consciente de entrega

### Contexto

O projeto precisa ser entregue em sete dias e sera avaliado principalmente por funcionamento, organizacao, experiencia, responsividade, documentacao e boas praticas.

### Problema

Adicionar funcionalidades sem priorizacao poderia reduzir a qualidade do fluxo principal, aumentar bugs e impedir uma entrega completa.

### Opcoes consideradas

1. Tentar implementar todas as funcionalidades de um sistema de producao.
2. Entregar um CRUD minimo sem preocupacao arquitetural.
3. Implementar integralmente os requisitos e registrar evolucoes futuras.

### Decisao adotada

Entregar primeiro um MVP completo, testado e documentado, com arquitetura em camadas, validacao, controle de conflitos, persistencia versionada e separacao entre cliente e administrador.

### Justificativa tecnica

Qualidade e adequacao ao problema sao mais importantes do que quantidade de funcionalidades. A decisao demonstra capacidade de priorizacao e reduz risco tecnico dentro do prazo.

### Beneficios

- maior probabilidade de entrega funcional;
- menor superficie de bugs;
- revisao e testes mais completos;
- documentacao coerente com o que foi entregue;
- base clara para evolucao.

### Trade-offs

- funcionalidades de producao permanecem fora da primeira versao;
- algumas decisoes serao deliberadamente simples;
- o MVP nao pretende representar todos os cenarios de uma empresa real.

### Evolucao futura

As funcionalidades adiadas deverao entrar por prioridade, impacto e evidencias de uso, sempre acompanhadas de testes, migracoes e revisao dos contratos.

## Funcionalidades planejadas para versoes futuras

As funcionalidades abaixo poderiam tornar o sistema mais robusto e completo em um ambiente de producao. Elas nao foram implementadas no MVP porque o desafio possui escopo definido e prazo limitado de sete dias. O adiamento foi consciente: priorizamos qualidade, organizacao, performance proporcional e entrega confiavel dos requisitos obrigatorios.

### Seguranca e acesso

- autenticacao com Spring Security e JWT;
- controle de acesso por perfis;
- auditoria completa de operacoes administrativas.

### Dominio e agenda

- cadastro completo de servicos;
- cadastro de profissionais;
- multiplos recursos de atendimento;
- agenda configuravel;
- horarios personalizados;
- intervalos entre atendimentos;
- bloqueio de datas;
- feriados;
- cancelamento automatico;
- soft delete.

### Comunicacao e operacao

- notificacoes por e-mail;
- notificacoes por WhatsApp;
- dashboard administrativo;
- logs estruturados;
- observabilidade;
- monitoramento.

### Plataforma e escala

- cache;
- Docker;
- CI/CD;
- testes de carga;
- internacionalizacao;
- multiempresa (Multi Tenant).

Cada item devera ser avaliado novamente quanto a requisitos, custo, seguranca, impacto no modelo de dados, operacao e necessidade real antes de ser implementado.