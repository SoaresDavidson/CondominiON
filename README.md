# CondominiON

Sistema web para gerenciamento de reunioes, pautas e votacoes em condominios.

## Sumario do Produto

O CondominiON e uma plataforma para apoiar assembleias condominiais online, centralizando o cadastro de condominios, usuarios, reunioes, pautas e votacoes. O sistema foi pensado para permitir que administradores organizem reunioes, acompanhem presencas, iniciem votacoes e consultem resultados ponderados conforme as unidades de cada proprietario.

Principais capacidades:

- Gerenciar multiplos condominios de forma isolada.
- Cadastrar administradores, proprietarios, procuradores e convidados.
- Agendar, iniciar, cancelar e finalizar reunioes.
- Registrar presenca de participantes em assembleias.
- Cadastrar pautas com descricao e referencia para anexos.
- Criar votacoes abertas ou fechadas.
- Registrar votos com peso calculado por terrenos e casas.
- Permitir representacao por procurador.
- Consultar resultados por quantidade de votos, peso total e percentual.
- Manter documentacao do contrato da API e do modelo de dados.

## Estrutura

- `Backend/`: API Ruby on Rails.
- `Frontend/`: interface React + Vite + Tailwind.
- `Docs/`: documentacao do projeto, contrato da API e tabelas do banco.
- `docker-compose.yml`: sobe PostgreSQL e backend Rails.

## Requisitos

Para rodar o projeto localmente:

- Docker e Docker Compose.
- Node.js e npm para o frontend.

Nao e necessario ter Ruby/Rails instalado localmente, pois o backend roda em container.

## Configuracao Inicial

Na raiz do projeto, copie o arquivo de exemplo de variaveis de ambiente:

```bash
cp .env.example .env
```

As variaveis padrao ja funcionam em ambiente local:

- Banco: `condominio`
- Usuario: `condominio`
- Senha: `condominio`
- Porta do PostgreSQL: `5432`
- Porta do backend: `3000`
- Porta do frontend: `5173`

## Rodando o Banco

Para subir apenas o PostgreSQL:

```bash
docker compose up -d postgres
```

Verifique se o banco esta saudavel:

```bash
docker compose ps
```

O servico `condominio-postgres` deve aparecer como `healthy`.

## Rodando o Backend

Para subir o backend Rails junto com o banco:

```bash
docker compose up -d backend
```

Esse comando tambem sobe o PostgreSQL, caso ele ainda nao esteja rodando.

Na inicializacao, o backend executa:

```bash
bin/rails db:prepare
```

Isso cria o banco e aplica as migrations quando necessario.

A API fica disponivel em:

```text
http://localhost:3000
```

Teste o backend:

```bash
curl http://localhost:3000/health
```

Resposta esperada:

```json
{"status":"ok"}
```

Para popular o banco com dados de exemplo:

```bash
docker compose run --rm backend bin/rails db:seed
```

O seed (`Backend/db/seeds.rb`) e idempotente (pode ser rodado varias vezes) e cria dois condominios com
usuarios de todos os papeis, reunioes em todos os tipos/status, votacoes de todos os tipos/visibilidades,
pauta com PDF anexado, presenca e log de acesso, para exercitar todas as funcionalidades do sistema:

| Condominio | Usuario | Papel | Login |
| --- | --- | --- | --- |
| Residencial Jardim das Palmeiras | Joao Silva | Administrador | `joao.silva@email.com` / `condominio123` |
| Residencial Jardim das Palmeiras | Maria Oliveira | Proprietario (adimplente) | `maria.oliveira@email.com` / `condominio123` |
| Residencial Jardim das Palmeiras | Carlos Souza | Proprietario (adimplente) | `carlos.souza@email.com` / `condominio123` |
| Residencial Jardim das Palmeiras | Roberto Lima | Proprietario (inadimplente) | `roberto.lima@email.com` / `condominio123` |
| Residencial Jardim das Palmeiras | Erling Haaland | Convidado | acesso por token (impresso ao final do seed) |
| Residencial Jardim das Palmeiras | Alexandre Ribas | Procurador (representa Maria) | acesso por token (impresso ao final do seed) |
| Edificio Bela Vista | Ana Pereira | Administrador | `ana.pereira@email.com` / `condominio123` |
| Edificio Bela Vista | Bruno Santos | Proprietario | `bruno.santos@email.com` / `condominio123` |

Convidado e Procurador nao tem senha: o comando de seed imprime no terminal o link
`http://localhost:5173/acesso/<token>` de cada um (o token e gerado aleatoriamente a cada banco novo).

Reunioes criadas no condominio principal, cobrindo cada combinacao de tipo/status:

- **Agendada** (`with_owners`): "Assembleia Extraordinaria - Manutencao do Elevador" — testar o fluxo "Iniciar".
- **Em andamento** (`with_owners`): "Assembleia Geral Ordinaria - Mai/2026" — uma votacao aberta ja com votos
  parciais, uma votacao secreta aguardando inicio e uma pauta sem votacao.
- **Finalizada** (`with_owners`): "Assembleia Geral Ordinaria - Fev/2026" — pauta com PDF anexado, duas votacoes
  encerradas com resultado, log de acesso e relatorio gerencial/exportacoes disponiveis.
- **Cancelada** (`with_owners`): "Assembleia Extraordinaria - Reforma da Piscina".
- **Restrita a administradores** (`administrators_only`): "Reuniao Interna da Administracao".
- **Com convidados** (`with_guests`, em andamento): "Reuniao Aberta - Apresentacao da Reforma da Fachada" — testar
  o acesso por token do Convidado/Procurador e votar ao vivo.

Para ver as rotas da API:

```bash
docker compose run --rm backend bin/rails routes
```

Para rodar a suite de testes do backend:

```bash
docker compose run --rm -e RAILS_ENV=test backend bin/rails test
```

## Rodando o Frontend

Entre na pasta do frontend:

```bash
cd Frontend
```

Instale as dependencias:

```bash
npm install
```

Suba o servidor Vite:

```bash
npm run dev
```

O frontend fica disponivel em:

```text
http://localhost:5173
```

## Rodando Tudo no Dia a Dia

Em um terminal, suba banco e backend:

```bash
docker compose up -d backend
```

Em outro terminal, suba o frontend:

```bash
cd Frontend
npm run dev
```

Depois acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Healthcheck: `http://localhost:3000/health`

## Parando os Servicos

Para parar backend e banco:

```bash
docker compose down
```

Para parar e remover tambem o volume do banco:

```bash
docker compose down -v
```

Use `down -v` apenas se quiser apagar os dados locais do PostgreSQL.

## Comandos Uteis

Backend:

```bash
docker compose build backend
docker compose up -d backend
docker compose logs -f backend
docker compose run --rm backend bin/rails db:prepare
docker compose run --rm backend bin/rails db:seed
docker compose run --rm backend bin/rails routes
docker compose run --rm -e RAILS_ENV=test backend bin/rails test
```

Frontend:

```bash
cd Frontend
npm run dev
npm run build
npm run lint
```

## Documentacao

- Contrato da API: `Docs/Contrato_API.md`
- Tabelas do banco: `Docs/Tabelas_Banco_de_Dados.md`
- Especificacao de requisitos: `Docs/ERSw CondominiOn Votações Online .md`

## Portas Padrao

| Servico | Porta | URL |
| --- | --- | --- |
| Frontend | `5173` | `http://localhost:5173` |
| Backend Rails | `3000` | `http://localhost:3000` |
| PostgreSQL | `5432` | `localhost:5432` |

## Problemas Comuns

### Porta em uso

Se alguma porta ja estiver ocupada, altere no `.env`:

```env
BACKEND_PORT=3001
POSTGRES_PORT=5433
```

Para o frontend, use:

```bash
npm run dev -- --port 5174
```

### Banco sem dados de exemplo

Rode:

```bash
docker compose run --rm backend bin/rails db:seed
```

### Recriar o banco local

```bash
docker compose down -v
docker compose up -d backend
docker compose run --rm backend bin/rails db:seed
```
