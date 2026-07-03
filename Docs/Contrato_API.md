# Contrato de API - CondominiON

Versao: 1.0  
Backend: Ruby on Rails API  
Base URL local: `http://localhost:3000`  
Prefixo da API: `/api/v1`

## Convencoes

- Formato de entrada e saida: `application/json`.
- Datas e horarios usam ISO 8601, por exemplo `2026-06-21T16:00:00-03:00`.
- Campos decimais sao retornados como numero quando expostos nos payloads de resultado.
- Endpoints de exclusao de usuario fazem desativacao logica (`active=false`).
- Em votacao aberta, o resultado inclui historico nominal dos votos.
- Em votacao fechada, o resultado omite o historico nominal.
- Todos os endpoints em `/api/v1`, exceto `/sessions` (create), `/meeting_accesses` e `/password_resets`, exigem o
  header `Authorization: Bearer <token>` obtido no login ou na troca de token de acesso. Ver secao "Autenticacao".

## Erros

### 404 Not Found

```json
{
  "error": "Couldn't find Meeting with 'id'=999"
}
```

### 422 Unprocessable Entity

```json
{
  "error": [
    "Email has already been taken"
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "token invalido"
}
```

### 403 Forbidden

```json
{
  "error": "acesso negado para este perfil"
}
```

## Enums

### User.role

- `administrator`
- `owner`
- `proxy`
- `guest`

### Meeting.meeting_type

- `administrators_only`
- `with_owners`
- `with_guests`

### Meeting.status

- `scheduled`
- `in_progress`
- `canceled`
- `finished`

### Vote.response_type

- `yes_no_abstain`
- `multiple_choice`
- `name_election`

### Vote.visibility

- `open_vote`
- `secret_vote`

### Vote.status

- `waiting`
- `active`
- `closed`

## Healthcheck

### GET `/health`

Verifica se a API esta respondendo.

Resposta `200`:

```json
{
  "status": "ok"
}
```

## Autenticacao

Administrador e Proprietario autenticam com email/senha e recebem um token de longa duracao ("acesso
autenticado permanente"). Convidado e Procurador nao tem senha: recebem um `access_token` de uso unico no
cadastro (ver `POST /condominiums/:condominium_id/users`) e o trocam por um token JWT escopado a sua reuniao.
Um novo login de Convidado/Procurador invalida o token anterior (sessao unica).

### POST `/api/v1/sessions`

Login de Administrador/Proprietario.

Payload:

```json
{
  "email": "joao.silva@email.com",
  "password": "condominio123"
}
```

Resposta `201`:

```json
{
  "token": "<jwt>",
  "user": { "id": 1, "role": "administrator", "...": "..." }
}
```

Resposta `401` em caso de credenciais invalidas.

### DELETE `/api/v1/sessions`

Encerra a sessao atual (requer `Authorization`). Para Convidado/Procurador invalida o token ativo.

Resposta `204`: sem corpo.

### POST `/api/v1/meeting_accesses`

Troca o `access_token` de Convidado/Procurador por um JWT escopado a reuniao vinculada.

Payload:

```json
{
  "access_token": "3f9c..."
}
```

Resposta `201`: igual ao login (`token` + `user`). Resposta `401` se o token for invalido.

### POST `/api/v1/password_resets`

Solicita recuperacao de senha (somente Administrador/Proprietario).

Payload: `{ "email": "joao.silva@email.com" }`

Resposta `200`:

```json
{
  "message": "Se o e-mail estiver cadastrado, voce recebera um link de recuperacao."
}
```

Fora do ambiente de producao, a resposta tambem inclui `reset_token` para uso manual, ja que o envio por
e-mail ainda nao esta implementado (ver `Docs/Plano_Implementacao.md`, Fase 4).

### PATCH `/api/v1/password_resets/:token`

Redefine a senha usando o token gerado acima (valido por 1 hora).

Payload: `{ "password": "novaSenha123" }`

Resposta `200` em caso de sucesso, `422` se o token for invalido/expirado.

## Condominios

### Objeto Condominium

```json
{
  "id": 1,
  "name": "Residencial Jardim das Palmeiras",
  "address": "Teresina - PI",
  "created_at": "2026-07-02T21:53:14.539Z",
  "updated_at": "2026-07-02T21:53:14.539Z"
}
```

### GET `/api/v1/condominiums`

Lista condominios ordenados por nome.

Resposta `200`:

```json
[
  {
    "id": 1,
    "name": "Residencial Jardim das Palmeiras",
    "address": "Teresina - PI",
    "created_at": "2026-07-02T21:53:14.539Z",
    "updated_at": "2026-07-02T21:53:14.539Z"
  }
]
```

### GET `/api/v1/condominiums/:id`

Busca um condominio.

### POST `/api/v1/condominiums`

Cria um condominio.

Payload:

```json
{
  "condominium": {
    "name": "Condominio Belas Flores",
    "address": "Rua das Flores, 100"
  }
}
```

Resposta `201`: objeto `Condominium`.

### PATCH `/api/v1/condominiums/:id`

Atualiza um condominio.

Payload:

```json
{
  "condominium": {
    "name": "Condominio Belas Flores",
    "address": "Nova Rua, 200"
  }
}
```

Resposta `200`: objeto `Condominium`.

### DELETE `/api/v1/condominiums/:id`

Remove um condominio.

Resposta `204`: sem corpo.

## Reunioes

### Objeto Meeting

```json
{
  "id": 1,
  "condominium_id": 1,
  "title": "Assembleia Geral Ordinaria - Mai/2026",
  "starts_at": "2026-07-03T21:53:14.567Z",
  "meeting_type": "with_owners",
  "status": "in_progress",
  "finished_at": null,
  "created_at": "2026-07-02T21:53:14.572Z",
  "updated_at": "2026-07-02T21:53:14.572Z"
}
```

### GET `/api/v1/condominiums/:condominium_id/meetings`

Lista reunioes do condominio.

Query params opcionais:

- `title`: busca parcial por titulo.
- `meeting_type`: `administrators_only`, `with_owners` ou `with_guests`.
- `status`: `scheduled`, `in_progress`, `canceled` ou `finished`.

Resposta `200`: lista de `Meeting`.

### GET `/api/v1/meetings/:id`

Busca uma reuniao com pautas e votacoes.

Resposta `200`:

```json
{
  "id": 1,
  "condominium_id": 1,
  "title": "Assembleia Geral Ordinaria - Mai/2026",
  "starts_at": "2026-07-03T21:53:14.567Z",
  "meeting_type": "with_owners",
  "status": "in_progress",
  "finished_at": null,
  "agenda_items": [],
  "votes": []
}
```

### POST `/api/v1/condominiums/:condominium_id/meetings`

Cria uma reuniao.

Payload:

```json
{
  "meeting": {
    "title": "Discussao sobre Higiene Canina",
    "starts_at": "2026-07-21T15:30:00-03:00",
    "meeting_type": "with_owners"
  }
}
```

Resposta `201`: objeto `Meeting`.

Regras:

- `starts_at` nao pode estar no passado.
- `status` padrao: `scheduled`.

### PATCH `/api/v1/meetings/:id`

Atualiza uma reuniao.

Payload:

```json
{
  "meeting": {
    "title": "Discussao sobre Higiene Canina",
    "starts_at": "2026-07-21T16:00:00-03:00",
    "meeting_type": "with_guests",
    "status": "scheduled"
  }
}
```

Resposta `200`: objeto `Meeting`.

### DELETE `/api/v1/meetings/:id`

Remove uma reuniao.

Resposta `204`: sem corpo.

### PATCH `/api/v1/meetings/:id/start`

Inicia uma reuniao agendada.

Resposta `200`: objeto `Meeting` com `status="in_progress"`.

Regras:

- A reuniao precisa estar com `status="scheduled"`.
- `starts_at` nao pode ser mais de 10 minutos no futuro (evita inicio adiantado demais).
- Somente Administrador pode iniciar.

### PATCH `/api/v1/meetings/:id/finish`

Finaliza uma reuniao.

Resposta `200`: objeto `Meeting` com `status="finished"`.

Regras:

- Nao pode existir votacao com `status="waiting"` ou `status="active"`.

### PATCH `/api/v1/meetings/:id/cancel`

Cancela uma reuniao.

Resposta `200`: objeto `Meeting` com `status="canceled"`.

Regras:

- A reuniao precisa estar com `status="scheduled"`.

### POST `/api/v1/meetings/:id/join`

Registra presenca de um usuario na reuniao.

Payload:

```json
{
  "user_id": 2
}
```

Resposta `201`:

```json
{
  "id": 1,
  "meeting_id": 1,
  "user_id": 2,
  "joined_at": "2026-07-02T21:53:14.628Z",
  "left_at": null,
  "created_at": "2026-07-02T21:53:14.631Z",
  "updated_at": "2026-07-02T21:53:14.631Z",
  "user": {
    "id": 2,
    "name": "Maria Oliveira",
    "email": "maria.oliveira@email.com"
  }
}
```

Regras:

- `user_id` precisa ser o proprio usuario autenticado (Administrador pode registrar presenca de terceiros).
- O papel do usuario precisa ser compativel com `meeting_type`: `administrators_only` aceita somente
  `administrator`; `with_owners` aceita `administrator`/`owner`; `with_guests` aceita qualquer papel.

### POST `/api/v1/meetings/:id/send_invitations`

Solicita disparo de convites em massa.

Payload:

```json
{
  "total_recipients": 76
}
```

Resposta `202`:

```json
{
  "meeting_id": 1,
  "status": "queued",
  "total_recipients": 76
}
```

## Usuarios

### Objeto User

```json
{
  "id": 2,
  "condominium_id": 1,
  "proxy_for_id": null,
  "meeting_id": null,
  "name": "Maria Oliveira",
  "email": "maria.oliveira@email.com",
  "role": "owner",
  "lots_count": 2,
  "houses_count": 1,
  "vote_weight": "5.0",
  "active": true,
  "delinquent": false
}
```

### GET `/api/v1/condominiums/:condominium_id/users`

Lista usuarios do condominio.

Query params opcionais:

- `name`: busca parcial por nome.
- `email`: busca parcial por e-mail.
- `role`: `administrator`, `owner`, `proxy` ou `guest`.

Resposta `200`: lista de `User`.

### GET `/api/v1/users/:id`

Busca um usuario.

Resposta `200`: objeto `User`.

### POST `/api/v1/condominiums/:condominium_id/users`

Cria um usuario.

Payload de proprietario:

```json
{
  "user": {
    "name": "Maria Oliveira",
    "email": "maria.oliveira@email.com",
    "role": "owner",
    "lots_count": 2,
    "houses_count": 1,
    "delinquent": false
  }
}
```

Payload de procurador:

```json
{
  "user": {
    "name": "Alexandre Ribas",
    "email": "alexribas@gmail.com",
    "role": "proxy",
    "proxy_for_id": 2,
    "meeting_id": 1
  }
}
```

Payload de convidado:

```json
{
  "user": {
    "name": "Erling Haaland",
    "email": "viking@gmail.com",
    "role": "guest",
    "meeting_id": 1
  }
}
```

Resposta `201`: objeto `User`. Para `administrator`/`owner`, inclui tambem `initial_password` (senha inicial
gerada aleatoriamente). Para `proxy`/`guest`, inclui `access_token` (usado em `POST /meeting_accesses`). Em
ambos os casos esses campos so aparecem na resposta de criacao — envio automatico por e-mail ainda nao esta
implementado (ver `Docs/Plano_Implementacao.md`, Fase 4).

Regras:

- `email` deve ser unico por condominio.
- `proxy` precisa de `proxy_for_id` e `meeting_id`.
- `proxy_for_id` precisa apontar para um proprietario adimplente.
- `guest` precisa de `meeting_id`.
- `owner` calcula `vote_weight` como `(lots_count * 2) + houses_count`.
- `proxy` herda `vote_weight` do proprietario representado.
- Somente Administrador pode criar/atualizar/desativar usuarios.

### PATCH `/api/v1/users/:id`

Atualiza um usuario.

Payload:

```json
{
  "user": {
    "name": "Maria Oliveira",
    "email": "maria.oliveira@email.com",
    "lots_count": 3,
    "houses_count": 1,
    "active": true,
    "delinquent": false
  }
}
```

Resposta `200`: objeto `User`.

Observacao:

- `role` nao e alterado por este endpoint, mesmo que enviado.

### DELETE `/api/v1/users/:id`

Desativa um usuario.

Resposta `200`: objeto `User` com `active=false`.

## Pautas

### Objeto AgendaItem

```json
{
  "id": 1,
  "meeting_id": 1,
  "title": "Item 01 - Aprovacao do Orcamento Anual",
  "description": "Votacao sobre a previsao orcamentaria do exercicio de 2026.",
  "attachment_url": null,
  "position": 1,
  "created_at": "2026-07-02T21:53:14.672Z",
  "updated_at": "2026-07-02T21:53:14.672Z"
}
```

### GET `/api/v1/meetings/:meeting_id/agenda_items`

Lista pautas da reuniao.

Resposta `200`: lista de `AgendaItem`.

### GET `/api/v1/agenda_items/:id`

Busca uma pauta.

Resposta `200`: objeto `AgendaItem`.

### POST `/api/v1/meetings/:meeting_id/agenda_items`

Cria uma pauta.

Payload:

```json
{
  "agenda_item": {
    "title": "Item 01 - Aprovacao do Orcamento Anual",
    "description": "Discussao e votacao da previsao orcamentaria.",
    "attachment_url": "https://exemplo.com/orcamento.pdf",
    "position": 1
  }
}
```

Resposta `201`: objeto `AgendaItem`.

Regras:

- `position` e opcional; se omitido, a API atribui a proxima posicao livre da reuniao.
- `position` precisa ser unico dentro da mesma reuniao.
- Somente Administrador pode criar/atualizar/excluir pautas.

### PATCH `/api/v1/agenda_items/:id`

Atualiza uma pauta.

Payload:

```json
{
  "agenda_item": {
    "title": "Item 01 - Orcamento Anual",
    "description": "Descricao atualizada.",
    "attachment_url": "https://exemplo.com/novo.pdf"
  }
}
```

Resposta `200`: objeto `AgendaItem`.

### DELETE `/api/v1/agenda_items/:id`

Remove uma pauta.

Resposta `204`: sem corpo. Resposta `422` se a pauta tiver uma votacao com `status="active"`; votacoes
`waiting`/`closed` vinculadas sao removidas junto com a pauta.

## Votacoes

### Objeto Vote

```json
{
  "id": 1,
  "meeting_id": 1,
  "agenda_item_id": 1,
  "statement": "Voce aprova o orcamento proposto para o exercicio de 2026?",
  "response_type": "yes_no_abstain",
  "visibility": "open_vote",
  "status": "active",
  "duration_minutes": 2,
  "started_at": "2026-07-02T21:53:14.700Z",
  "closes_at": "2026-07-02T21:55:14.700Z",
  "closed_at": null,
  "created_at": "2026-07-02T21:53:14.706Z",
  "updated_at": "2026-07-02T21:53:14.706Z"
}
```

### GET `/api/v1/meetings/:meeting_id/votes`

Lista votacoes da reuniao com pauta e opcoes.

Query params opcionais:

- `status`: `waiting`, `active` ou `closed`.
- `response_type`: `yes_no_abstain`, `multiple_choice` ou `name_election`.
- `visibility`: `open_vote` ou `secret_vote`.

Resposta `200`: lista de `Vote` com `agenda_item` e `vote_options`.

### GET `/api/v1/votes/:id`

Busca uma votacao com pauta e opcoes.

Resposta `200`: objeto `Vote` com `agenda_item` e `vote_options`.

### POST `/api/v1/meetings/:meeting_id/votes`

Cria uma votacao.

Payload para Sim/Nao/Abstencao:

```json
{
  "vote": {
    "agenda_item_id": 1,
    "statement": "Voce aprova o orcamento proposto para o exercicio de 2026?",
    "response_type": "yes_no_abstain",
    "visibility": "open_vote",
    "duration_minutes": 2
  }
}
```

Payload para multipla escolha ou eleicao:

```json
{
  "vote": {
    "agenda_item_id": 1,
    "statement": "Escolha o novo sindico.",
    "response_type": "name_election",
    "visibility": "secret_vote",
    "duration_minutes": 5
  },
  "options": [
    "Fernanda Lima",
    "Marcos Pereira"
  ]
}
```

Resposta `201`: objeto `Vote` com `vote_options`.

Regras:

- `duration_minutes` precisa ser inteiro maior que zero.
- A pauta precisa pertencer a reuniao informada.
- A pauta so pode ter uma votacao cadastrada.
- Votacoes novas ficam com `status="waiting"` se o status nao for enviado.
- Para `yes_no_abstain`, se a votacao for iniciada sem opcoes, a API cria `Sim`, `Nao` e `Abstencao`.
- Ao iniciar (`PATCH .../start`), a votacao e encerrada automaticamente quando `closes_at` e atingido (processamento
  assincrono em segundo plano).
- Somente Administrador pode criar/atualizar/excluir/iniciar/encerrar votacoes.

### PATCH `/api/v1/votes/:id`

Atualiza uma votacao.

Payload:

```json
{
  "vote": {
    "statement": "Voce aprova a proposta revisada?",
    "response_type": "yes_no_abstain",
    "visibility": "open_vote",
    "duration_minutes": 3
  }
}
```

Resposta `200`: objeto `Vote` com `vote_options`.

### DELETE `/api/v1/votes/:id`

Remove uma votacao.

Resposta `204`: sem corpo.

### PATCH `/api/v1/votes/:id/start`

Inicia uma votacao.

Resposta `200`: objeto `Vote` com `status="active"`.

Regras:

- A reuniao precisa estar `in_progress`.
- A votacao precisa estar `waiting`.
- Define `started_at` e `closes_at`.

### PATCH `/api/v1/votes/:id/finish`

Finaliza uma votacao.

Resposta `200`: objeto `Vote` com `status="closed"`.

### GET `/api/v1/votes/:id/result`

Consulta resultado da votacao.

Resposta para votacao aberta:

```json
{
  "vote": {
    "id": 1,
    "meeting_id": 1,
    "agenda_item_id": 1,
    "statement": "Voce aprova o orcamento proposto para o exercicio de 2026?",
    "response_type": "yes_no_abstain",
    "visibility": "open_vote",
    "status": "active",
    "duration_minutes": 2,
    "started_at": "2026-07-02T21:53:14.700Z",
    "closes_at": "2026-07-02T21:55:14.700Z",
    "closed_at": null
  },
  "summary": [
    {
      "option_id": 1,
      "description": "Sim",
      "ballots_count": 1,
      "weight_total": 5.0,
      "weight_percentage": 100.0
    },
    {
      "option_id": 2,
      "description": "Nao",
      "ballots_count": 0,
      "weight_total": 0.0,
      "weight_percentage": 0.0
    }
  ],
  "ballots": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "name": "Maria Oliveira",
        "email": "maria.oliveira@email.com"
      },
      "option": "Sim",
      "weight": 5.0,
      "cast_at": "2026-07-02T21:55:03.772Z"
    }
  ]
}
```

Resposta para votacao fechada:

```json
{
  "vote": {
    "id": 1,
    "visibility": "secret_vote"
  },
  "summary": [
    {
      "option_id": 1,
      "description": "Sim",
      "ballots_count": 18,
      "weight_total": 27.5,
      "weight_percentage": 73.33
    }
  ],
  "ballots": []
}
```

## Opcoes de Voto

### Objeto VoteOption

```json
{
  "id": 1,
  "vote_id": 1,
  "description": "Sim",
  "position": 1,
  "created_at": "2026-07-02T21:53:14.731Z",
  "updated_at": "2026-07-02T21:53:14.731Z"
}
```

### GET `/api/v1/votes/:vote_id/vote_options`

Lista opcoes da votacao.

Resposta `200`: lista de `VoteOption`.

### GET `/api/v1/vote_options/:id`

Busca uma opcao.

Resposta `200`: objeto `VoteOption`.

### POST `/api/v1/votes/:vote_id/vote_options`

Cria uma opcao de voto.

Payload:

```json
{
  "vote_option": {
    "description": "Fernanda Lima",
    "position": 1
  }
}
```

Resposta `201`: objeto `VoteOption`.

### PATCH `/api/v1/vote_options/:id`

Atualiza uma opcao.

Payload:

```json
{
  "vote_option": {
    "description": "Marcos Pereira",
    "position": 2
  }
}
```

Resposta `200`: objeto `VoteOption`.

### DELETE `/api/v1/vote_options/:id`

Remove uma opcao.

Resposta `204`: sem corpo.

## Votos Registrados

### Objeto Ballot

```json
{
  "id": 1,
  "vote_id": 1,
  "vote_option_id": 1,
  "user_id": 2,
  "weight": 5.0,
  "cast_at": "2026-07-02T21:55:03.772Z"
}
```

### GET `/api/v1/votes/:vote_id/ballots`

Lista votos registrados em uma votacao. Somente Administrador.

Resposta `200`: lista de `Ballot`.

### POST `/api/v1/votes/:vote_id/ballots`

Registra um voto.

Payload:

```json
{
  "user_id": 2,
  "vote_option_id": 1
}
```

Resposta `201`:

```json
{
  "id": 1,
  "vote_id": 1,
  "vote_option_id": 1,
  "user_id": 2,
  "weight": 5.0,
  "cast_at": "2026-07-02T21:55:03.772Z"
}
```

Regras:

- `user_id` precisa ser o proprio usuario autenticado (nao e possivel votar em nome de outro usuario).
- A votacao precisa estar `active`.
- A opcao precisa pertencer a votacao.
- O usuario precisa estar presente na reuniao.
- O usuario so pode votar uma vez por votacao.
- O peso do voto e copiado de `user.vote_weight` no momento do registro.
- IP e user-agent da requisicao sao gravados para fins de auditoria (colunas `ip_address`/`user_agent` na
  tabela `ballots`), mas nao sao expostos nos payloads de resposta.

## Fluxos Recomendados

### Login (Administrador/Proprietario)

1. `POST /api/v1/sessions`
2. Usar o `token` retornado no header `Authorization: Bearer <token>` das chamadas seguintes.

### Criar e iniciar uma reuniao

1. `POST /api/v1/condominiums/:condominium_id/meetings`
2. `POST /api/v1/meetings/:meeting_id/agenda_items`
3. `PATCH /api/v1/meetings/:id/start`

### Criar e iniciar uma votacao

1. `POST /api/v1/meetings/:meeting_id/votes`
2. `POST /api/v1/votes/:vote_id/vote_options`, quando aplicavel.
3. `PATCH /api/v1/votes/:id/start`

### Participar e votar (Convidado/Procurador)

1. `POST /api/v1/meeting_accesses` com o `access_token` recebido no cadastro.
2. `POST /api/v1/meetings/:id/join`
3. `GET /api/v1/meetings/:meeting_id/votes?status=active`
4. `POST /api/v1/votes/:vote_id/ballots`
5. `GET /api/v1/votes/:id/result`

