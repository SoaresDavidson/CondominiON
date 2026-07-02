# Tabelas do Banco de Dados - CondominiON

Banco: PostgreSQL  
ORM: Active Record / Ruby on Rails  
Fonte: `Backend/db/schema.rb`  
Versao do schema: `2026_07_02_000800`

## Visao Geral

O banco possui 8 tabelas principais:

- `condominiums`: condominios cadastrados.
- `users`: usuarios do condominio.
- `meetings`: reunioes/assembleias.
- `meeting_users`: presencas de usuarios em reunioes.
- `agenda_items`: pautas das reunioes.
- `votes`: votacoes vinculadas a pautas.
- `vote_options`: opcoes de resposta das votacoes.
- `ballots`: votos registrados pelos usuarios.

## Diagrama Textual de Relacionamentos

```text
condominiums 1---N users
condominiums 1---N meetings

meetings 1---N agenda_items
meetings 1---N votes
meetings 1---N meeting_users

users 1---N meeting_users
users 1---N ballots
users 1---N users, via proxy_for_id

agenda_items 1---N votes
votes 1---N vote_options
votes 1---N ballots
vote_options 1---N ballots
```

## Tabela `condominiums`

Armazena os condominios gerenciados pelo sistema.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `name` | `string` | Sim | - | Nome do condominio. |
| `address` | `string` | Nao | - | Endereco do condominio. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_condominiums_on_name` | `name` | Sim |

Relacionamentos:

- Possui muitos `users`.
- Possui muitas `meetings`.

## Tabela `users`

Armazena administradores, proprietarios, procuradores e convidados.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `condominium_id` | `bigint` | Sim | - | Condominio ao qual o usuario pertence. |
| `proxy_for_id` | `bigint` | Nao | - | Usuario proprietario representado por um procurador. |
| `meeting_id` | `bigint` | Nao | - | Reuniao de acesso unico para convidados/procuradores. |
| `name` | `string` | Sim | - | Nome do usuario. |
| `email` | `string` | Sim | - | E-mail do usuario. |
| `role` | `integer` | Sim | `1` | Perfil do usuario. |
| `lots_count` | `integer` | Sim | `0` | Quantidade de terrenos. |
| `houses_count` | `integer` | Sim | `0` | Quantidade de casas. |
| `vote_weight` | `decimal(10,2)` | Sim | `0.0` | Peso total do voto. |
| `active` | `boolean` | Sim | `true` | Indica se o usuario esta ativo. |
| `delinquent` | `boolean` | Sim | `false` | Indica inadimplencia. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Valores de `role`:

| Valor | Nome |
| --- | --- |
| `0` | `administrator` |
| `1` | `owner` |
| `2` | `proxy` |
| `3` | `guest` |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_users_on_condominium_id_and_email` | `condominium_id`, `email` | Sim |
| `index_users_on_condominium_id` | `condominium_id` | Nao |
| `index_users_on_meeting_id` | `meeting_id` | Nao |
| `index_users_on_proxy_for_id` | `proxy_for_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `condominium_id` | `condominiums.id` |
| `meeting_id` | `meetings.id` |
| `proxy_for_id` | `users.id` |

Regras aplicadas no model:

- `email` e unico por condominio.
- `owner` calcula `vote_weight` como `(lots_count * 2) + houses_count`.
- `proxy` herda o peso do proprietario representado.
- `proxy` exige `proxy_for_id` e `meeting_id`.
- `guest` exige `meeting_id`.

## Tabela `meetings`

Armazena reunioes e assembleias do condominio.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `condominium_id` | `bigint` | Sim | - | Condominio da reuniao. |
| `title` | `string` | Sim | - | Titulo da reuniao. |
| `starts_at` | `datetime` | Sim | - | Data e hora previstas para inicio. |
| `meeting_type` | `integer` | Sim | `1` | Tipo de reuniao. |
| `status` | `integer` | Sim | `0` | Status atual da reuniao. |
| `finished_at` | `datetime` | Nao | - | Data e hora de finalizacao. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Valores de `meeting_type`:

| Valor | Nome |
| --- | --- |
| `0` | `administrators_only` |
| `1` | `with_owners` |
| `2` | `with_guests` |

Valores de `status`:

| Valor | Nome |
| --- | --- |
| `0` | `scheduled` |
| `1` | `in_progress` |
| `2` | `canceled` |
| `3` | `finished` |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_meetings_on_condominium_id_and_starts_at` | `condominium_id`, `starts_at` | Nao |
| `index_meetings_on_condominium_id` | `condominium_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `condominium_id` | `condominiums.id` |

Relacionamentos:

- Pertence a um `condominium`.
- Possui muitas `agenda_items`.
- Possui muitas `votes`.
- Possui muitas presencas em `meeting_users`.

## Tabela `meeting_users`

Registra presenca de usuarios em reunioes.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `meeting_id` | `bigint` | Sim | - | Reuniao acessada. |
| `user_id` | `bigint` | Sim | - | Usuario presente. |
| `joined_at` | `datetime` | Sim | - | Data e hora de entrada. |
| `left_at` | `datetime` | Nao | - | Data e hora de saida. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_meeting_users_on_meeting_id_and_user_id` | `meeting_id`, `user_id` | Sim |
| `index_meeting_users_on_meeting_id` | `meeting_id` | Nao |
| `index_meeting_users_on_user_id` | `user_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `meeting_id` | `meetings.id` |
| `user_id` | `users.id` |

Regra:

- Um mesmo usuario so pode ter um registro de presenca por reuniao.

## Tabela `agenda_items`

Armazena as pautas vinculadas a uma reuniao.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `meeting_id` | `bigint` | Sim | - | Reuniao da pauta. |
| `title` | `string` | Sim | - | Titulo da pauta. |
| `description` | `text` | Nao | - | Descricao detalhada. |
| `attachment_url` | `string` | Nao | - | URL ou caminho de anexo. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_agenda_items_on_meeting_id` | `meeting_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `meeting_id` | `meetings.id` |

Relacionamentos:

- Pertence a uma `meeting`.
- Pode ter muitas `votes`.

## Tabela `votes`

Armazena as votacoes vinculadas a uma reuniao e a uma pauta.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `meeting_id` | `bigint` | Sim | - | Reuniao da votacao. |
| `agenda_item_id` | `bigint` | Sim | - | Pauta votada. |
| `statement` | `text` | Sim | - | Enunciado da votacao. |
| `response_type` | `integer` | Sim | `0` | Tipo de resposta. |
| `visibility` | `integer` | Sim | `0` | Visibilidade da votacao. |
| `status` | `integer` | Sim | `0` | Status da votacao. |
| `duration_minutes` | `integer` | Sim | `2` | Duracao configurada, em minutos. |
| `started_at` | `datetime` | Nao | - | Data e hora de inicio real. |
| `closes_at` | `datetime` | Nao | - | Data e hora prevista de encerramento. |
| `closed_at` | `datetime` | Nao | - | Data e hora de encerramento real. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Valores de `response_type`:

| Valor | Nome |
| --- | --- |
| `0` | `yes_no_abstain` |
| `1` | `multiple_choice` |
| `2` | `name_election` |

Valores de `visibility`:

| Valor | Nome |
| --- | --- |
| `0` | `open_vote` |
| `1` | `secret_vote` |

Valores de `status`:

| Valor | Nome |
| --- | --- |
| `0` | `waiting` |
| `1` | `active` |
| `2` | `closed` |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_votes_on_agenda_item_id` | `agenda_item_id` | Nao |
| `index_votes_on_meeting_id` | `meeting_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `meeting_id` | `meetings.id` |
| `agenda_item_id` | `agenda_items.id` |

Regras aplicadas no model:

- `duration_minutes` deve ser inteiro maior que zero.
- A pauta deve pertencer a mesma reuniao da votacao.
- Para iniciar a votacao, a reuniao precisa estar `in_progress`.
- Para iniciar a votacao, a votacao precisa estar `waiting`.

## Tabela `vote_options`

Armazena as opcoes de resposta de uma votacao.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `vote_id` | `bigint` | Sim | - | Votacao da opcao. |
| `description` | `string` | Sim | - | Texto da opcao. |
| `position` | `integer` | Sim | `1` | Ordem de exibicao. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_vote_options_on_vote_id_and_position` | `vote_id`, `position` | Sim |
| `index_vote_options_on_vote_id` | `vote_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `vote_id` | `votes.id` |

Regra:

- A posicao de uma opcao deve ser unica dentro da mesma votacao.

## Tabela `ballots`

Armazena os votos registrados pelos usuarios.

| Coluna | Tipo | Obrigatorio | Padrao | Descricao |
| --- | --- | --- | --- | --- |
| `id` | `bigint` | Sim | auto | Identificador primario. |
| `vote_id` | `bigint` | Sim | - | Votacao em que o voto foi registrado. |
| `vote_option_id` | `bigint` | Sim | - | Opcao escolhida. |
| `user_id` | `bigint` | Sim | - | Usuario votante. |
| `weight` | `decimal(10,2)` | Sim | - | Peso do voto no momento do registro. |
| `cast_at` | `datetime` | Sim | - | Data e hora do voto. |
| `created_at` | `datetime` | Sim | auto | Data de criacao. |
| `updated_at` | `datetime` | Sim | auto | Data da ultima atualizacao. |

Indices:

| Nome | Colunas | Unico |
| --- | --- | --- |
| `index_ballots_on_vote_id_and_user_id` | `vote_id`, `user_id` | Sim |
| `index_ballots_on_vote_id` | `vote_id` | Nao |
| `index_ballots_on_vote_option_id` | `vote_option_id` | Nao |
| `index_ballots_on_user_id` | `user_id` | Nao |

Chaves estrangeiras:

| Coluna | Referencia |
| --- | --- |
| `vote_id` | `votes.id` |
| `vote_option_id` | `vote_options.id` |
| `user_id` | `users.id` |

Regras aplicadas no model:

- O usuario so pode votar uma vez por votacao.
- A votacao precisa estar `active`.
- A opcao escolhida precisa pertencer a votacao.
- O usuario precisa estar presente na reuniao em `meeting_users`.
- O campo `weight` copia `users.vote_weight` no momento do voto.

## Ordem Recomendada de Criacao

Para respeitar as chaves estrangeiras:

1. `condominiums`
2. `meetings`
3. `users`
4. `meeting_users`
5. `agenda_items`
6. `votes`
7. `vote_options`
8. `ballots`

## Observacoes de Integridade

- `users.email` e unico apenas dentro do mesmo condominio.
- `meeting_users` impede presenca duplicada do mesmo usuario na mesma reuniao.
- `ballots` impede voto duplicado do mesmo usuario na mesma votacao.
- `vote_options` impede duas opcoes com a mesma posicao na mesma votacao.
- Votacoes fechadas (`secret_vote`) preservam os votos no banco, mas a API omite o historico nominal no endpoint de resultado.
