# Backend Rails - CondominiON

API Ruby on Rails para gerenciar condominios, reunioes, pautas, usuarios, votacoes e votos ponderados.

## Rodando com Docker

```bash
docker compose up -d backend
```

A API fica disponivel em `http://localhost:3000`.

## Comandos uteis

```bash
docker compose run --rm backend bin/rails db:prepare db:seed
docker compose run --rm backend bin/rails routes
```

## Endpoints principais

- `GET /health`
- `GET /api/v1/condominiums`
- `POST /api/v1/condominiums`
- `GET /api/v1/condominiums/:condominium_id/meetings`
- `PATCH /api/v1/meetings/:id/start`
- `PATCH /api/v1/meetings/:id/finish`
- `POST /api/v1/meetings/:id/join`
- `GET /api/v1/condominiums/:condominium_id/users`
- `POST /api/v1/meetings/:meeting_id/agenda_items`
- `POST /api/v1/meetings/:meeting_id/votes`
- `PATCH /api/v1/votes/:id/start`
- `POST /api/v1/votes/:vote_id/ballots`
- `GET /api/v1/votes/:id/result`

## Exemplo de voto

```bash
curl -X POST http://localhost:3000/api/v1/votes/1/ballots \
  -H 'Content-Type: application/json' \
  -d '{"user_id":2,"vote_option_id":1}'
```

