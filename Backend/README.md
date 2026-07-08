# Backend — CondominiOn

API em Ruby on Rails (modo `api_only`) para gerenciamento de condomínios, usuários, reuniões, pautas e
votações ponderadas. Veja o contrato completo da API em [`Docs/Contrato_API.md`](../Docs/Contrato_API.md) e o
schema do banco em [`Docs/Tabelas_Banco_de_Dados.md`](../Docs/Tabelas_Banco_de_Dados.md).

## Stack

- **Ruby** 3.3.6 / **Rails** 7.2 (`config.api_only = true`)
- **PostgreSQL** via `pg`
- **Autenticação**: JWT próprio (gem `jwt`) + `bcrypt` (`has_secure_password`) — sem Devise
- **ActiveStorage** (disco local em dev/produção) para upload de anexos em PDF
- **ActionMailer**: `letter_opener_web` em desenvolvimento (visualização em `/letter_opener`, escolhido em vez
  do `letter_opener` puro porque o backend roda em container Docker headless, sem navegador local para abrir o
  e-mail automaticamente), `:test` em teste, `:smtp` via `ENV` em produção
- **ActiveJob** com adapter `:async` (encerramento automático de votações — sem Redis/Sidekiq)
- **roo** (leitura de planilhas), **caxlsx** (exportação `.xlsx`), **prawn**/**prawn-table** (geração de PDF)
- **Minitest** (`rails test`) para testes de integração e de mailer

## Estrutura

```text
app/
  controllers/api/v1/   # um controller por recurso (condominiums, users, meetings, agenda_items,
                         # votes, vote_options, ballots, sessions, meeting_accesses, password_resets)
  controllers/concerns/authenticatable.rb   # autenticacao JWT + autorizacao por role/escopo
  models/                # Condominium, User, Meeting, MeetingUser, AccessLog, AgendaItem, Vote,
                         # VoteOption, Ballot
  mailers/               # UserMailer (boas-vindas, convite de acesso, lembrete, recuperacao de senha)
  services/              # JwtService, AccessLogHtmlRenderer, MeetingReportPdf, VoteResultPdf,
                         # VoteResultSpreadsheet
  jobs/                  # CloseExpiredVoteJob (encerra votacao ao expirar duration_minutes)
config/
  routes.rb              # namespace api/v1
  environments/          # delivery de e-mail e storage por ambiente
db/
  schema.rb              # fonte da verdade do schema (ver Docs/Tabelas_Banco_de_Dados.md)
  seeds.rb                # popula o banco com dados cobrindo todas as funcionalidades (ver abaixo)
test/
  integration/api_v1_requests_test.rb   # suite principal, cobre praticamente todos os endpoints
  mailers/user_mailer_test.rb
```

## Rodando com Docker (recomendado)

A partir da raiz do repositorio (ver [README raiz](../README.md) para o `.env` e o `docker-compose.yml`):

```bash
docker compose up -d backend
```

Isso sobe Postgres + backend e roda `bin/rails db:prepare` automaticamente (cria o banco e aplica migrations
pendentes). A API fica em `http://localhost:3000`.

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

## Banco de Dados

- **Schema**: 9 tabelas de negocio (`condominiums`, `users`, `meetings`, `meeting_users`, `access_logs`,
  `agenda_items`, `votes`, `vote_options`, `ballots`) + tabelas internas do `ActiveStorage`. Detalhamento
  completo (colunas, tipos, indices, foreign keys, enums e regras de cada model) em
  [`Docs/Tabelas_Banco_de_Dados.md`](../Docs/Tabelas_Banco_de_Dados.md) — mantenha esse documento atualizado ao
  criar uma migration.
- **Migrations**: `Backend/db/migrate/*` — aplique com `db:prepare` (cria + migra) ou `db:migrate` (só migra).
- **Seeds**: `db/seeds.rb` e idempotente e cria dois condominios com usuarios de todos os papeis, reunioes em
  todos os tipos/status e votacoes de todos os tipos/visibilidades (inclui pauta com PDF anexado, presenca e
  log de acesso), para exercitar toda a aplicacao de uma vez. Credenciais geradas: ver o
  [README raiz](../README.md#rodando-o-backend).

```bash
docker compose run --rm backend bin/rails db:prepare      # cria o banco e aplica migrations
docker compose run --rm backend bin/rails db:seed         # popula com dados de demonstracao
docker compose run --rm backend bin/rails db:migrate:status
docker compose exec postgres psql -U condominio -d condominio   # acesso direto ao psql
```

## Autenticacao e Autorizacao

- **Administrador/Proprietario**: login com e-mail/senha (`POST /api/v1/sessions`) recebem um JWT de sessao
  permanente.
- **Convidado/Procurador**: nao tem senha. Recebem um `access_token` de uso unico no cadastro
  (`POST /api/v1/condominiums/:id/users`), que e trocado por um JWT escopado a reuniao vinculada via
  `POST /api/v1/meeting_accesses`. Um novo login invalida a sessao anterior (rotacao de `jti`).
- Toda rota de negocio passa por `Api::V1::BaseController` (`Authenticatable#authenticate_request!`), que exige
  `Authorization: Bearer <jwt>`. Autorizacao por papel/escopo (`authorize_roles!`, `authorize_condominium_scope!`,
  `authorize_meeting_scope!`) e feita em `before_action` de cada controller.
- Ver `app/services/jwt_service.rb` e `app/controllers/concerns/authenticatable.rb`.

## E-mail

`ActionMailer` esta configurado e `UserMailer` envia: boas-vindas com senha inicial (administrator/owner),
convite de acesso (proxy/guest), lembrete de reuniao (usuario ja existente) e recuperacao de senha. Em
desenvolvimento, os e-mails **nao saem de verdade** — acesse `http://localhost:3000/letter_opener` para ver
cada e-mail enviado pela aplicacao. Em producao, configure um provedor real (SendGrid, SES, Mailgun, etc.) via
as variaveis `SMTP_*` (ver `.env.example` na raiz).

## Anexos (ActiveStorage)

Pautas aceitam upload de PDF (`multipart/form-data`, campo `agenda_item[attachment]`). A validacao exige
extensao `.pdf`, `Content-Type: application/pdf` **e** assinatura de bytes `%PDF-` no arquivo (as tres
checagens precisam passar). O download e servido por `GET /api/v1/agenda_items/:id/attachment`, autenticado e
restrito ao escopo da reuniao.

## Rotas principais

Lista completa e payloads em [`Docs/Contrato_API.md`](../Docs/Contrato_API.md). Para ver todas as rotas
registradas:

```bash
docker compose run --rm backend bin/rails routes
```

Alguns endpoints de destaque:

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/api/v1/sessions` | Login administrator/owner |
| `POST` | `/api/v1/meeting_accesses` | Troca `access_token` por JWT (guest/proxy) |
| `POST` | `/api/v1/password_resets` | Solicita recuperacao de senha |
| `GET/POST` | `/api/v1/condominiums` | CRUD de condominios |
| `GET/POST` | `/api/v1/condominiums/:id/users` | CRUD de usuarios |
| `GET/POST` | `/api/v1/condominiums/:id/meetings` | CRUD de reunioes |
| `PATCH` | `/api/v1/meetings/:id/start\|finish\|cancel` | Transicoes de estado da reuniao |
| `POST` | `/api/v1/meetings/:id/join\|leave` | Registro de presenca |
| `GET` | `/api/v1/meetings/:id/access_log` | Log de auditoria (HTML) — somente administrator |
| `GET` | `/api/v1/meetings/:id/managerial_report` | Relatorio gerencial (PDF) — reuniao finalizada |
| `POST` | `/api/v1/meetings/:meeting_id/agenda_items` | Cria pauta (aceita anexo PDF) |
| `GET` | `/api/v1/agenda_items/:id/attachment` | Download do anexo |
| `POST` | `/api/v1/meetings/:meeting_id/votes` | Cria votacao |
| `PATCH` | `/api/v1/votes/:id/start\|finish` | Transicoes de estado da votacao |
| `POST` | `/api/v1/votes/:vote_id/ballots` | Registra voto |
| `GET` | `/api/v1/votes/:id/result` | Apuracao da votacao |
| `GET` | `/api/v1/votes/:id/export_pdf\|export_xlsx` | Exportacao do resultado — reuniao finalizada |

## Testes

```bash
docker compose run --rm -e RAILS_ENV=test backend bin/rails db:test:prepare
docker compose run --rm -e RAILS_ENV=test backend bin/rails test
```

Rodar um arquivo/teste especifico:

```bash
docker compose run --rm -e RAILS_ENV=test backend bin/rails test test/integration/api_v1_requests_test.rb
docker compose run --rm -e RAILS_ENV=test backend bin/rails test -n "/nome_do_teste/"
```

## Variaveis de Ambiente

Ver `.env.example` na raiz do repositorio. As mais relevantes para o backend:

| Variavel | Uso |
| --- | --- |
| `POSTGRES_*` | Conexao com o Postgres |
| `SECRET_KEY_BASE` | Assinatura de sessao/segredos do Rails (tambem usado pelo `JwtService`) |
| `RAILS_CORS_ALLOWED_ORIGINS` | Origens liberadas no CORS (frontend) |
| `BACKEND_HOST` | Host usado para montar links do `ActionMailer` |
| `FRONTEND_URL` | Base usada nos links enviados por e-mail (`/login`, `/acesso/:token`, `/redefinir-senha/:token`) |
| `MAILER_FROM` | Remetente dos e-mails |
| `SMTP_*` | Credenciais do provedor de e-mail em producao |

## Comandos Uteis

```bash
docker compose build backend
docker compose up -d backend
docker compose logs -f backend
docker compose run --rm backend bin/rails console
docker compose run --rm backend bin/rails db:seed
docker compose run --rm backend bin/rails routes
```

## Documentacao Relacionada

- Contrato da API: [`Docs/Contrato_API.md`](../Docs/Contrato_API.md)
- Tabelas do banco: [`Docs/Tabelas_Banco_de_Dados.md`](../Docs/Tabelas_Banco_de_Dados.md)
- Plano de implementacao (o que ja existe / o que falta): [`Docs/Plano_Implementacao.md`](../Docs/Plano_Implementacao.md)
- Especificacao de requisitos: `Docs/ERSw CondominiOn Votações Online .md`
