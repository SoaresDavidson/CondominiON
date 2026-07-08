# Frontend — CondominiOn

Interface web (SPA) em React + TypeScript para o CondominiOn: login, gestão de condomínios/usuários/reuniões,
cadastro de pautas e votações, votação em tempo real e apuração de resultados. Consome a API descrita em
[`Docs/Contrato_API.md`](../Docs/Contrato_API.md).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **react-router-dom** — roteamento e proteção de rotas por papel
- **@tanstack/react-query** — cache/estado de dados remotos (`useQuery`/`useMutation`)
- **Tailwind CSS v4** (plugin do Vite, sem `tailwind.config.js`) — estilização utilitária
- **ESLint** (`typescript-eslint`, `eslint-plugin-react-hooks`) para lint

Sem Redux/Zustand: todo estado de servidor vive no React Query; estado de UI local fica em `useState` dentro de
cada página.

## Estrutura

```text
src/
  api/            # um arquivo por recurso (client.ts = fetch wrapper com auth/erros/upload/download,
                   # meetings.ts, users.ts, votes.ts, agendaItems.ts, ballots.ts, condominiums.ts,
                   # voteOptions.ts, auth.ts, tokenStore.ts, types.ts)
  pages/          # uma pagina por tela/fluxo (ver rotas abaixo)
  components/     # Layout, ProtectedRoute, ui.tsx (Button, Card, Field, Table, ConfirmDialog, etc.)
  context/        # AuthContext (usuario logado, token, papel) + hook useAuth
  routes/         # AppRoutes.tsx — declaracao de todas as rotas
  utils/labels.ts # traducao dos enums da API (status, tipos, visibilidade) para rotulos em pt-BR
```

## Rodando

Requer a API rodando (ver [README do backend](../Backend/README.md) ou o [README raiz](../README.md)).

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npm run preview   # serve o build de producao localmente
```

## Variaveis de Ambiente

```bash
cp .env.example .env
```

| Variavel | Padrao | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api/v1` | Base URL da API consumida por `src/api/client.ts` |

## Autenticacao e Rotas Protegidas

- `AuthContext`/`useAuth` guardam o usuario logado e o token (persistido via `tokenStore.ts`).
- `ProtectedRoute` redireciona para `/login` se nao autenticado, e para `/condominios` se o papel do usuario
  nao estiver na lista `roles` exigida pela rota (ex.: telas de cadastro/gestao sao `roles={['administrator']}`).
- Fluxos de entrada:
  - `/login` — Administrador/Proprietario (e-mail + senha).
  - `/acesso` e `/acesso/:token` — Convidado/Procurador troca o `access_token` recebido por e-mail por uma
    sessao escopada a reuniao.
  - `/esqueci-senha` e `/redefinir-senha/:token` — recuperacao de senha.
- Papeis (`Role`): `administrator`, `owner`, `proxy`, `guest` — cada pagina/acao verifica o papel atual
  (`user.role`) para mostrar ou esconder comandos administrativos (ex.: botoes de excluir/editar, exportar
  relatorios).

## Mapa de Rotas

| Rota | Pagina | Acesso |
| --- | --- | --- |
| `/login` | `Login` | Publica |
| `/acesso`, `/acesso/:token` | `MeetingAccess` | Publica |
| `/esqueci-senha` | `ForgotPassword` | Publica |
| `/redefinir-senha/:token` | `ResetPassword` | Publica |
| `/condominios` | `Condominios` | Autenticado |
| `/condominios/:condominiumId/reunioes` | `Reunioes` | Autenticado |
| `/condominios/:condominiumId/reunioes/nova` | `Agendar` | Administrador |
| `/condominios/:condominiumId/usuarios` | `Usuarios` | Administrador |
| `/condominios/:condominiumId/usuarios/novo` | `UsuarioForm` | Administrador |
| `/usuarios/:id` | `UsuarioForm` | Autenticado |
| `/reunioes/:id` | `Detalhes` | Autenticado |
| `/reunioes/:meetingId/pautas` | `Pautas` | Administrador |
| `/reunioes/:id/convites` | `Convites` | Administrador |
| `/reunioes/:id/procurador` | `Procurador` | Administrador |
| `/reunioes/:meetingId/votacoes` | `Votacoes` | Autenticado |
| `/reunioes/:meetingId/votacoes/nova` | `VotacaoForm` | Administrador |
| `/votacoes/:id` | `VotacaoForm` | Autenticado |
| `/votacoes/:id/votar` | `Voto` | Autenticado |
| `/votacoes/:id/resultado` | `Resultado` | Autenticado |

## Camada de API (`src/api/client.ts`)

- `apiFetch<T>(path, options)`: wrapper de `fetch` que injeta `Authorization: Bearer <token>`, serializa JSON
  ou `FormData` (upload de arquivo), trata `401` (limpa sessao) e converte erros da API (`{ error }`) em
  `ApiError`.
- `apiDownload(path, filename)`: baixa arquivos autenticados (PDF/HTML/XLSX — anexos de pauta, log de acesso,
  relatorio gerencial, exportacoes de resultado) via `Blob` + link temporario, ja que downloads via `<a href>`
  simples nao enviam o header `Authorization`.

## Testando Manualmente

Depois de rodar o seed do backend (`docker compose run --rm backend bin/rails db:seed`), use as credenciais
listadas no [README raiz](../README.md#rodando-o-backend) para exercitar todos os papeis e estados de reuniao
(agendada, em andamento, finalizada, cancelada, com convidados).

## Documentacao Relacionada

- Contrato da API: [`Docs/Contrato_API.md`](../Docs/Contrato_API.md)
- Especificacao de requisitos: `Docs/ERSw CondominiOn Votações Online .md`
