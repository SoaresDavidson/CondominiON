# Plano de Implementação — Gaps entre ERS e Estado Atual

Este documento lista o que falta, o que precisa mudar e o que precisa ser feito para o projeto atender à `ERSw CondominiOn Votações Online .md`. Baseado na auditoria comparando ERS ↔ `Contrato_API.md` ↔ `Tabelas_Banco_de_Dados.md` ↔ código real (`Backend/`, `Frontend/`).

Cada item referencia o requisito/caso de uso do ERS quando aplicável (RF = Requisito Funcional, RNF = Requisito Não-Funcional, UC = Caso de Uso).

## Status atual

**Fases 0, 1, 2 e 6 implementadas e verificadas** (suíte de testes do backend — 24 testes — verde; `npm run build`/`lint` do frontend limpos; fluxo login → condomínios → reuniões → detalhes → pautas → votação testado manualmente no browser). Pendências conhecidas dentro dessas fases:

- Confirmação de ações destrutivas (iniciar/cancelar/finalizar reunião, excluir votação) ainda não tem modal de confirmação no frontend.
- Envio de e-mail (senha inicial, convite de procurador, recuperação de senha) continua dependente da Fase 4 — por ora as credenciais voltam na própria resposta da API.
- Limitação de schema já conhecida e não resolvida nesta rodada: `users.condominium_id` é 1:N (um usuário pertence a um único condomínio), o que não cobre literalmente RF7 ("usuários podem pertencer a diversos condomínios"). Resolver exigiria uma tabela `users_condominiums` — fora de escopo por ora.

Fases 3 a 5 e 7 a 12 continuam pendentes (dependem de serviços externos: e-mail, videoconferência, LLM, transcrição, ou são trabalho não solicitado ainda).

---

## Fase 0 — Autenticação e Autorização (bloqueador de tudo) ✅ Concluída (envio de e-mail fica para a Fase 4)

Hoje não existe login, sessão nem controle de acesso — qualquer endpoint pode ser chamado por qualquer um. Isso é pré-requisito para praticamente todos os fluxos do ERS (RNF4).

- [x] Adicionar gem de autenticação (`bcrypt` + `jwt`, solução própria — sem Devise). Ver [Gemfile](../Backend/Gemfile), [jwt_service.rb](../Backend/app/services/jwt_service.rb).
- [x] Login para Administrador/Proprietário (sessão permanente). Ver [sessions_controller.rb](../Backend/app/controllers/api/v1/sessions_controller.rb).
- [x] Acesso único vinculado a uma reunião para Convidado/Procurador (token de uso único trocado por JWT escopado). Ver [meeting_accesses_controller.rb](../Backend/app/controllers/api/v1/meeting_accesses_controller.rb).
- [x] Tela e fluxo de "Esqueci minha senha" (3.4.2.4): endpoint de solicitação, geração de link temporário e endpoint de redefinição implementados ([password_resets_controller.rb](../Backend/app/controllers/api/v1/password_resets_controller.rb), páginas `ForgotPassword`/`ResetPassword`). **Envio por e-mail ainda não existe** — resposta genérica já segue o texto do ERS, mas o token só é exposto em ambiente non-production até a Fase 4.
- [x] Middleware/`before_action` de autorização por `role` em todos os controllers. Ver [authenticatable.rb](../Backend/app/controllers/concerns/authenticatable.rb) e `Api::V1::BaseController`.
- [x] Regra: tipo do usuário deve ser compatível com o tipo da reunião para poder entrar (RF3, UC2, fluxo "Entrar na Reunião"). Ver `MeetingsController#role_allowed_for_meeting?`.
- [x] Bloquear login duplicado do mesmo usuário/procurador em duas sessões simultâneas na mesma reunião (rotação de `active_session_token`/`jti` a cada novo login de convidado/procurador).
- [x] Geração de senha inicial aleatória (Administrador/Proprietário) e `access_token` (Convidado/Procurador) no cadastro de usuário. **Envio por e-mail ainda não existe** — credencial é devolvida na resposta da API (`initial_password`/`access_token`) até a Fase 4.

---

## Fase 1 — Frontend real (parar de ser mockup) ✅ Concluída

`Frontend/src/App.tsx` hoje é só uma casca visual: dados hardcoded, sem `fetch`/`axios`, sem roteador, sem chamadas à API.

- [x] Adicionar cliente HTTP (`fetch` nativo) apontando para `VITE_API_URL` / `/api/v1`. Ver [client.ts](../Frontend/src/api/client.ts).
- [x] Adicionar roteador (`react-router-dom`) em vez de `useState<Page>` local. Ver [AppRoutes.tsx](../Frontend/src/routes/AppRoutes.tsx).
- [x] Criar camada de estado/dados (`@tanstack/react-query`) para buscar e cachear condomínios, reuniões, usuários, pautas, votações, resultados. Ver `src/api/*.ts` e as páginas em `src/pages/`.
- [x] Substituir todos os arrays hardcoded (`meetings`, `users`, `votes`) por dados vindos da API.
- [x] Implementar formulários reais com validação e envio via `POST`/`PATCH` (`useMutation` em cada página de formulário).
- [x] Implementar tela de login e proteção de rotas por papel do usuário. Ver [Login.tsx](../Frontend/src/pages/Login.tsx), [ProtectedRoute.tsx](../Frontend/src/components/ProtectedRoute.tsx).
- [x] Implementar contagem regressiva real da votação (`closes_at` vindo da API) com atualização em tempo real. Ver `useCountdown` em [Voto.tsx](../Frontend/src/pages/Voto.tsx).
- [x] Refletir no menu/telas as permissões por papel (comandos administrativos ocultos para não-admin nas páginas `Reunioes`, `Votacoes`, `Detalhes`).
- [x] Tratar estados de erro/carregamento (404, 422, 401, 403 do `Contrato_API.md`) na UI via `ErrorBanner`/`LoadingState` ([ui.tsx](../Frontend/src/components/ui.tsx)).

---

## Fase 2 — Regras de negócio faltantes no escopo atual (backend) — quase concluída (falta confirmação de ações destrutivas na UI)

Mesmo dentro do subconjunto já coberto por `Contrato_API.md`, várias regras do ERS (seção 3.6) não estão implementadas.

- [x] **Votação**: impedir cadastro de duas votações para o mesmo `agenda_item` na mesma reunião (regra 7 de "Cadastro de Votação"). Validação `validates :agenda_item_id, uniqueness` em [vote.rb](../Backend/app/models/vote.rb).
- [x] **Votação**: encerramento automático ao expirar `duration_minutes`. Implementado com `ActiveJob` (adapter `:async`, sem Redis/Sidekiq — ver [close_expired_vote_job.rb](../Backend/app/jobs/close_expired_vote_job.rb)) agendado em `Vote#start!`. Evoluir para fila persistente (Solid Queue/Sidekiq) fica como hardening futuro.
- [x] **Reunião**: ao iniciar, validar que `starts_at` não é mais de 10 minutos no futuro (fluxo "Iniciar Reunião"). Ver `Meeting#start!`.
- [ ] **Reunião**: exigir confirmação/segundo passo antes de iniciar e antes de cancelar — **não implementado**; as ações no frontend disparam a chamada direto ao clicar (sem modal de confirmação).
- [x] **Pautas**: impedir duas pautas com o mesmo número de "Ordem" na mesma reunião — campo `position` adicionado (ver Fase 6, já concluída).
- [x] **Pautas**: `AgendaItem` agora só bloqueia exclusão quando há `vote` com `status="active"` vinculado; votações `waiting`/`closed` são removidas junto com a pauta. Ver `clear_inactive_votes_or_abort` em [agenda_item.rb](../Backend/app/models/agenda_item.rb).
- [x] **Usuários**: regra "Procurador só pode ser vinculado a Proprietário adimplente" aplicada em [user.rb](../Backend/app/models/user.rb) (`proxy_for_must_be_adimplent`).
- [x] **Usuários**: `role` ignorado em `PATCH /users/:id` e reforçado por autorização (`UsersController` exige `administrator` para `create`/`update`/`destroy`).
- [x] **Auditoria de voto**: `ip_address` e `user_agent` capturados no momento do voto (colunas novas em `ballots`, preenchidas em `BallotsController#create`). "Rede" (ex. operadora/ASN) não é capturado — fora de escopo sem serviço de geolocalização de IP.

---

## Fase 3 — Disparo de Convites em Massa (RF6, 3.4.1.5)

Endpoint atual (`POST /meetings/:id/send_invitations`) só recebe `total_recipients` e devolve `202 queued` — não processa arquivo nem envia nada.

- [ ] Adicionar upload real de arquivo (`multipart/form-data`) para planilha `.csv`/`.xlsx`.
- [ ] Adicionar gem de parsing (`roo` ou `caxlsx`/`csv` nativo para `.csv`).
- [ ] Validar colunas obrigatórias (Nome, E-Mail, Unidades, Peso Total) e formato de cada linha; retornar erro detalhando a linha com problema.
- [ ] Criar automaticamente os usuários que não existem e vinculá-los à reunião.
- [ ] Disparar e-mail para cada usuário da lista (ver Fase 4) com link da reunião, credenciais provisórias e edital de convocação.
- [ ] Retornar contagem de e-mails enviados com sucesso para a UI exibir notificação.

---

## Fase 4 — E-mail transacional (RF6, RF3, RNF4)

Não existe nenhum `Mailer` no projeto (`actionmailer` está no `Gemfile.lock` só como dependência transitiva, sem uso).

- [ ] Configurar `ActionMailer` (SMTP local para dev, ex. Mailhog/Letter Opener; provedor real para produção — SendGrid, SES, etc.).
- [ ] Mailer de boas-vindas com senha inicial gerada aleatoriamente (cadastro de usuário).
- [ ] Mailer de convite de procurador (link da reunião + credenciais de acesso único).
- [ ] Mailer de convite em massa (Fase 3).
- [ ] Mailer de recuperação de senha (Fase 0).

---

## Fase 5 — Anexos de Pauta (upload real de PDF) (RF8, UC5)

Hoje `attachment_url` é só uma `string` livre — não há upload de arquivo nem validação de tipo.

- [ ] Adicionar `ActiveStorage` (ou S3/Carrierwave) para upload real de arquivo.
- [ ] Validar que o anexo é PDF (tipo de conteúdo e/ou extensão).
- [ ] Servir o download do anexo por link direto para participantes da reunião.
- [ ] Atualizar `Contrato_API.md` e `Tabelas_Banco_de_Dados.md` para refletir o novo mecanismo de upload.

---

## Fase 6 — Gestão de Pautas: campo "Ordem" (UC5, 3.4.5) ✅ Concluída

O ERS especifica um campo de ordenação explícito para pautas; o schema atual não tinha.

- [x] Migration adicionando `position` (inteiro) em `agenda_items`. Ver [migration](../Backend/db/migrate/20260702001100_add_position_to_agenda_items.rb).
- [x] Índice único `(meeting_id, position)`.
- [x] Validação de unicidade no model ([agenda_item.rb](../Backend/app/models/agenda_item.rb)).
- [x] `Contrato_API.md`/`Tabelas_Banco_de_Dados.md` atualizados.
- [x] Listagem de pautas ordenada por `position` (antes era `created_at`); se `position` não for enviado no `POST`, a API atribui a próxima posição livre da reunião.

---

## Fase 7 — Videoconferência Embutida (RNF5)

Nenhuma integração de vídeo existe hoje.

- [ ] Decidir provedor (Zoom SDK, Google Meet embed, ou MS Teams SDK) — ERS já sugere Zoom como preferência.
- [ ] Backend: gerar/armazenar credenciais de sala por reunião (ex.: `zoom_meeting_id`, `join_url`).
- [ ] Frontend: embutir player/iframe/SDK na tela de "Entrar na Reunião", garantindo que o usuário não precise trocar de aba.
- [ ] Integrar evento de entrada/saída do provedor de vídeo com o registro de presença (`meeting_users`), para permitir monitorar presença e votação simultaneamente.

---

## Fase 8 — Log de Auditoria de Acessos (RF4, 3.4.1.8)

- [ ] Nova tabela (ex. `access_logs`) com `user_id`, `ip`, `user_agent`, `meeting_id`, `event` (entrada/saída), `timestamp`.
- [ ] Registrar entrada/saída da reunião (hoje só `joined_at`/`left_at` em `meeting_users`, sem IP/browser).
- [ ] Endpoint/ação `Gerar Log da Reunião` retornando HTML formatado para download (conforme protótipo 3.4.1.8).

---

## Fase 9 — Chat e Transcrição (RF4, 3.4.1.7, 3.4.1.9)

- [ ] Implementar chat em tempo real durante a reunião (ActionCable no backend + WebSocket no frontend), com persistência de histórico.
- [ ] Endpoint `Baixar Chat` retornando HTML formatado.
- [ ] Avaliar integração de transcrição automática (ex.: Whisper API ou serviço do provedor de vídeo escolhido na Fase 7).
- [ ] Endpoint `Gerar Transcrição` retornando HTML formatado, incluindo marcações de trechos inaudíveis conforme protótipo.
- [ ] Processamento em segundo plano (job assíncrono) disparado ao finalizar a reunião, conforme fluxo "Finalizar Reunião" ("inicia o processamento em paralelo e em segundo plano dos arquivos ligados à Reunião").

---

## Fase 10 — Ata Gerada por LLM (RF4, 3.4.1.6)

- [ ] Escolher provedor de LLM (ex. API Claude/Anthropic ou OpenAI) e adicionar gem/cliente HTTP.
- [ ] Job assíncrono que, ao finalizar a reunião, monta prompt com pauta, resultados de votação e transcrição, e gera a ata em texto formatado.
- [ ] Endpoint `Gerar Ata` retornando HTML formatado para download.
- [ ] Persistir a ata gerada (para não reprocessar a cada download).

---

## Fase 11 — Relatório Gerencial Consolidado (RF4, UC6, 3.4.6)

- [ ] Endpoint que compila: estatísticas de presença (total de unidades, presentes, % quórum, presentes por procuração), deliberações por pauta (total de votos, resultado, vencedor/% dos votos).
- [ ] Gem de geração de PDF (`prawn`, `wicked_pdf`, ou similar) para o layout do relatório consolidado.
- [ ] Exportação de Resultado de Votação em PDF e Excel (tela de Resultado, 3.4.3.2) — gem adicional para Excel (`caxlsx`).
- [ ] Disponibilizar todos esses documentos apenas após a reunião estar "Finalizada", com mensagem de espera se ainda não gerados (fluxo "Detalhes da Reunião").

---

## Fase 12 — Não-funcionais (RNF1, RNF2, RNF3)

- [ ] **RNF3 — Desempenho**: testes de carga simulando 1000 usuários simultâneos votando (ex. k6, Locust) contra os endpoints de `ballots` e `votes`; validar índices e possível necessidade de connection pooling/cache.
- [ ] **RNF1 — Usabilidade mobile/idosos**: revisar frontend responsivo, tamanhos de fonte/toque, contraste, testes em dispositivos móveis reais.
- [ ] **RNF2 — Banco gratuito**: já atendido (PostgreSQL). Sem ação.
- [ ] Cobertura de testes automatizados para os novos fluxos (auth, e-mail, upload, jobs assíncronos) — hoje só há testes de integração de CRUD (`test/integration/api_v1_requests_test.rb`).

---

## Priorização sugerida

1. **Fase 0 (Auth)** — nada mais faz sentido sem controle de acesso.
2. **Fase 1 (Frontend real)** — sem isso o backend fica inacessível na prática.
3. **Fase 2 (regras de negócio faltantes)** — corrige o que já deveria funcionar dentro do escopo atual.
4. **Fase 6 (campo Ordem em pautas)** — pequena, mas bloqueia consistência com o ERS.
5. **Fase 3 + Fase 4 (convites em massa + e-mail)** — fluxo de entrada de usuários na plataforma.
6. **Fase 5 (upload de anexo real)**.
7. **Fase 7 (videoconferência)** — dependência externa grande, mas central ao produto.
8. **Fase 8 + Fase 9 (log, chat, transcrição)**.
9. **Fase 10 (Ata por LLM)**.
10. **Fase 11 (relatório consolidado/exportações)**.
11. **Fase 12 (não-funcionais)** — contínuo, mas load testing formal fica para o fim, quando os fluxos reais existirem.
