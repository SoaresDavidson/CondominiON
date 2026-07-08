require "test_helper"

class ApiV1RequestsTest < ActionDispatch::IntegrationTest
  setup do
    @condominium = Condominium.create!(name: "Residencial Teste", address: "Rua A")
    @admin = @condominium.users.create!(
      name: "Admin Teste",
      email: "admin@example.com",
      role: :administrator,
      password: "senha123456"
    )
    @owner = @condominium.users.create!(
      name: "Maria Oliveira",
      email: "maria@example.com",
      role: :owner,
      lots_count: 2,
      houses_count: 1,
      password: "senha123456"
    )
    @meeting = @condominium.meetings.create!(
      title: "Assembleia de Teste",
      starts_at: 5.minutes.from_now,
      meeting_type: :with_owners
    )
    @agenda_item = @meeting.agenda_items.create!(
      title: "Orcamento Anual",
      description: "Aprovacao do orcamento"
    )
    @admin_headers = auth_headers(@admin)
    @owner_headers = auth_headers(@owner)
  end

  test "healthcheck responds ok" do
    get "/health"

    assert_response :success
    assert_equal({ "status" => "ok" }, json_response)
  end

  test "requests without a token are rejected" do
    get "/api/v1/condominiums"
    assert_response :unauthorized
  end

  test "condominiums endpoints create list show update and destroy" do
    get "/api/v1/condominiums", headers: @admin_headers
    assert_response :success
    assert_includes json_response.map { |item| item["name"] }, "Residencial Teste"

    post "/api/v1/condominiums",
         params: json_payload(condominium: { name: "Condominio Novo", address: "Rua Nova" }),
         headers: @admin_headers
    assert_response :created
    created_id = json_response.fetch("id")

    get "/api/v1/condominiums/#{created_id}", headers: @admin_headers
    assert_response :forbidden

    patch "/api/v1/condominiums/#{@condominium.id}",
          params: json_payload(condominium: { address: "Rua Atualizada" }),
          headers: @admin_headers
    assert_response :success
    assert_equal "Rua Atualizada", json_response.fetch("address")

    delete "/api/v1/condominiums/#{@condominium.id}", headers: @admin_headers
    assert_response :no_content
  end

  test "users endpoints create list show update and deactivate" do
    get "/api/v1/condominiums/#{@condominium.id}/users", params: { role: "owner" }, headers: @admin_headers
    assert_response :success
    assert_equal ["Maria Oliveira"], json_response.map { |user| user["name"] }

    get "/api/v1/condominiums/#{@condominium.id}/users", headers: @owner_headers
    assert_response :forbidden

    assert_enqueued_emails 1 do
      post "/api/v1/condominiums/#{@condominium.id}/users",
           params: json_payload(user: {
             name: "Alexandre Ribas",
             email: "alexandre@example.com",
             role: "proxy",
             proxy_for_id: @owner.id,
             meeting_id: @meeting.id
           }),
           headers: @admin_headers
    end
    assert_response :created
    proxy_id = json_response.fetch("id")
    assert_equal "proxy", json_response.fetch("role")
    assert_equal "5.0", json_response.fetch("vote_weight")
    assert json_response.fetch("access_token").present?

    get "/api/v1/users/#{proxy_id}", headers: @admin_headers
    assert_response :success
    assert_equal "Alexandre Ribas", json_response.fetch("name")

    patch "/api/v1/users/#{proxy_id}",
          params: json_payload(user: { name: "Alexandre Ribas Atualizado", active: true }),
          headers: @admin_headers
    assert_response :success
    assert_equal "Alexandre Ribas Atualizado", json_response.fetch("name")

    delete "/api/v1/users/#{proxy_id}", headers: @admin_headers
    assert_response :success
    assert_equal false, json_response.fetch("active")
  end

  test "creating an owner sends a welcome email with the initial password" do
    assert_enqueued_emails 1 do
      post "/api/v1/condominiums/#{@condominium.id}/users",
           params: json_payload(user: {
             name: "Novo Proprietario",
             email: "novo.proprietario@example.com",
             role: "owner",
             lots_count: 1,
             houses_count: 0
           }),
           headers: @admin_headers
    end
    assert_response :created
    assert json_response.fetch("initial_password").present?
  end

  test "password reset request sends an email and the token can be used to reset the password" do
    assert_enqueued_emails 1 do
      post "/api/v1/password_resets", params: json_payload(email: @admin.email), headers: json_headers
    end
    assert_response :success
    token = json_response.fetch("reset_token")
    assert token.present?

    patch "/api/v1/password_resets/#{token}", params: json_payload(password: "novasenha123"), headers: json_headers
    assert_response :success

    patch "/api/v1/password_resets/#{token}", params: json_payload(password: "outrasenha123"), headers: json_headers
    assert_response :unprocessable_entity
  end

  test "creating a proxy for a delinquent owner is rejected" do
    delinquent_owner = @condominium.users.create!(
      name: "Owner Inadimplente",
      email: "inadimplente@example.com",
      role: :owner,
      lots_count: 1,
      delinquent: true
    )

    post "/api/v1/condominiums/#{@condominium.id}/users",
         params: json_payload(user: {
           name: "Procurador Rejeitado",
           email: "procurador.rejeitado@example.com",
           role: "proxy",
           proxy_for_id: delinquent_owner.id,
           meeting_id: @meeting.id
         }),
         headers: @admin_headers
    assert_response :unprocessable_entity
  end

  test "meetings endpoints create list show update start cancel finish join and invitations" do
    get "/api/v1/condominiums/#{@condominium.id}/meetings", params: { status: "scheduled" }, headers: @admin_headers
    assert_response :success
    assert_includes json_response.map { |meeting| meeting["title"] }, "Assembleia de Teste"

    post "/api/v1/condominiums/#{@condominium.id}/meetings",
         params: json_payload(meeting: {
           title: "Reuniao Criada",
           starts_at: 5.minutes.from_now.iso8601,
           meeting_type: "with_guests"
         }),
         headers: @admin_headers
    assert_response :created
    meeting_id = json_response.fetch("id")

    get "/api/v1/meetings/#{meeting_id}", headers: @admin_headers
    assert_response :success
    assert_equal "Reuniao Criada", json_response.fetch("title")

    patch "/api/v1/meetings/#{meeting_id}",
          params: json_payload(meeting: { title: "Reuniao Atualizada" }),
          headers: @admin_headers
    assert_response :success
    assert_equal "Reuniao Atualizada", json_response.fetch("title")

    post "/api/v1/meetings/#{@meeting.id}/join",
         params: json_payload(user_id: @owner.id),
         headers: @owner_headers
    assert_response :created
    assert_equal @owner.id, json_response.fetch("user_id")

    post "/api/v1/meetings/#{meeting_id}/send_invitations",
         params: json_payload(total_recipients: 12),
         headers: @admin_headers
    assert_response :accepted
    assert_equal "queued", json_response.fetch("status")
    assert_equal 12, json_response.fetch("total_recipients")

    patch "/api/v1/meetings/#{meeting_id}/start", headers: @admin_headers
    assert_response :success
    assert_equal "in_progress", json_response.fetch("status")

    patch "/api/v1/meetings/#{meeting_id}/finish", headers: @admin_headers
    assert_response :success
    assert_equal "finished", json_response.fetch("status")

    cancelable = @condominium.meetings.create!(
      title: "Reuniao Cancelavel",
      starts_at: 4.days.from_now,
      meeting_type: :with_owners
    )
    patch "/api/v1/meetings/#{cancelable.id}/cancel", headers: @admin_headers
    assert_response :success
    assert_equal "canceled", json_response.fetch("status")

    removable = @condominium.meetings.create!(
      title: "Reuniao Removivel",
      starts_at: 5.days.from_now,
      meeting_type: :with_owners
    )
    delete "/api/v1/meetings/#{removable.id}", headers: @admin_headers
    assert_response :no_content
  end

  test "meeting cannot be started more than 10 minutes ahead of schedule" do
    early_meeting = @condominium.meetings.create!(
      title: "Reuniao Adiantada",
      starts_at: 1.hour.from_now,
      meeting_type: :with_owners
    )

    patch "/api/v1/meetings/#{early_meeting.id}/start", headers: @admin_headers
    assert_response :unprocessable_entity
  end

  test "owner only sees meetings with_owners and guest only sees own meeting" do
    admins_only = @condominium.meetings.create!(
      title: "Reuniao Restrita",
      starts_at: 1.day.from_now,
      meeting_type: :administrators_only
    )

    get "/api/v1/condominiums/#{@condominium.id}/meetings", headers: @owner_headers
    assert_response :success
    titles = json_response.map { |meeting| meeting["title"] }
    assert_includes titles, "Assembleia de Teste"
    assert_not_includes titles, admins_only.title

    guest = @condominium.users.create!(name: "Convidado", email: "convidado@example.com", role: :guest, meeting: @meeting)
    guest_headers = auth_headers(guest)

    get "/api/v1/condominiums/#{@condominium.id}/meetings", headers: guest_headers
    assert_response :success
    assert_equal ["Assembleia de Teste"], json_response.map { |meeting| meeting["title"] }

    get "/api/v1/meetings/#{admins_only.id}", headers: guest_headers
    assert_response :forbidden
  end

  test "agenda items endpoints create list show update and destroy" do
    get "/api/v1/meetings/#{@meeting.id}/agenda_items", headers: @admin_headers
    assert_response :success
    assert_equal ["Orcamento Anual"], json_response.map { |item| item["title"] }

    post "/api/v1/meetings/#{@meeting.id}/agenda_items",
         params: json_payload(agenda_item: {
           title: "Eleicao Sindical",
           description: "Escolha do novo sindico",
           attachment_url: "https://example.com/edital.pdf"
         }),
         headers: @admin_headers
    assert_response :created
    agenda_item_id = json_response.fetch("id")
    assert_equal 2, json_response.fetch("position")

    get "/api/v1/agenda_items/#{agenda_item_id}", headers: @admin_headers
    assert_response :success
    assert_equal "Eleicao Sindical", json_response.fetch("title")

    patch "/api/v1/agenda_items/#{agenda_item_id}",
          params: json_payload(agenda_item: { title: "Eleicao Atualizada" }),
          headers: @admin_headers
    assert_response :success
    assert_equal "Eleicao Atualizada", json_response.fetch("title")

    delete "/api/v1/agenda_items/#{agenda_item_id}", headers: @admin_headers
    assert_response :no_content
  end

  test "agenda item accepts only pdf attachment and serves it to meeting participants" do
    pdf = Rack::Test::UploadedFile.new(Rails.root.join("test/fixtures/files/sample.pdf"), "application/pdf")

    post "/api/v1/meetings/#{@meeting.id}/agenda_items",
         params: {
           agenda_item: {
             title: "Pauta com PDF",
             description: "Documento oficial",
             attachment: pdf
           }
         },
         headers: @admin_headers.except("CONTENT_TYPE")
    assert_response :created
    assert_equal "sample.pdf", json_response.fetch("attachment_filename")
    attachment_url = json_response.fetch("attachment_url")

    get attachment_url, headers: @owner_headers
    assert_response :success
    assert_equal "application/pdf", response.media_type

    text_file = Rack::Test::UploadedFile.new(Rails.root.join("test/fixtures/files/not_pdf.txt"), "text/plain")
    post "/api/v1/meetings/#{@meeting.id}/agenda_items",
         params: {
           agenda_item: {
             title: "Pauta invalida",
             attachment: text_file
           }
         },
         headers: @admin_headers.except("CONTENT_TYPE")
    assert_response :unprocessable_entity
    assert_match(/PDF/, json_response.fetch("error").join(" "))
  end

  test "agenda item with active vote cannot be destroyed" do
    @meeting.start!
    vote = @meeting.votes.create!(
      agenda_item: @agenda_item,
      statement: "Votacao ativa",
      response_type: :yes_no_abstain,
      visibility: :open_vote,
      duration_minutes: 2
    )
    vote.start!

    delete "/api/v1/agenda_items/#{@agenda_item.id}", headers: @admin_headers
    assert_response :unprocessable_entity
  end

  test "votes vote options ballots and result endpoints work" do
    @meeting.start!
    @meeting.meeting_users.create!(user: @owner, joined_at: Time.current)

    post "/api/v1/meetings/#{@meeting.id}/votes",
         params: json_payload(vote: {
           agenda_item_id: @agenda_item.id,
           statement: "Voce aprova o orcamento?",
           response_type: "multiple_choice",
           visibility: "open_vote",
           duration_minutes: 3
         }, options: ["Aprovar", "Reprovar"]),
         headers: @admin_headers
    assert_response :created
    vote_id = json_response.fetch("id")
    assert_equal 2, json_response.fetch("vote_options").size

    post "/api/v1/meetings/#{@meeting.id}/votes",
         params: json_payload(vote: {
           agenda_item_id: @agenda_item.id,
           statement: "Segunda votacao para a mesma pauta",
           response_type: "yes_no_abstain",
           visibility: "open_vote",
           duration_minutes: 2
         }),
         headers: @admin_headers
    assert_response :unprocessable_entity

    get "/api/v1/meetings/#{@meeting.id}/votes", params: { status: "waiting" }, headers: @admin_headers
    assert_response :success
    assert_includes json_response.map { |vote| vote["id"] }, vote_id

    get "/api/v1/votes/#{vote_id}", headers: @admin_headers
    assert_response :success
    assert_equal "Voce aprova o orcamento?", json_response.fetch("statement")

    patch "/api/v1/votes/#{vote_id}",
          params: json_payload(vote: { duration_minutes: 4 }),
          headers: @admin_headers
    assert_response :success
    assert_equal 4, json_response.fetch("duration_minutes")

    get "/api/v1/votes/#{vote_id}/vote_options", headers: @admin_headers
    assert_response :success
    first_option_id = json_response.first.fetch("id")

    post "/api/v1/votes/#{vote_id}/vote_options",
         params: json_payload(vote_option: { description: "Abster", position: 3 }),
         headers: @admin_headers
    assert_response :created
    created_option_id = json_response.fetch("id")

    get "/api/v1/vote_options/#{created_option_id}", headers: @admin_headers
    assert_response :success
    assert_equal "Abster", json_response.fetch("description")

    patch "/api/v1/vote_options/#{created_option_id}",
          params: json_payload(vote_option: { description: "Abstencao" }),
          headers: @admin_headers
    assert_response :success
    assert_equal "Abstencao", json_response.fetch("description")

    delete "/api/v1/vote_options/#{created_option_id}", headers: @admin_headers
    assert_response :no_content

    patch "/api/v1/votes/#{vote_id}/start", headers: @admin_headers
    assert_response :success
    assert_equal "active", json_response.fetch("status")

    get "/api/v1/votes/#{vote_id}/ballots", headers: @admin_headers
    assert_response :success
    assert_equal [], json_response

    post "/api/v1/votes/#{vote_id}/ballots",
         params: json_payload(user_id: @owner.id, vote_option_id: first_option_id),
         headers: @owner_headers
    assert_response :created
    assert_equal 5.0, json_response.fetch("weight")

    post "/api/v1/votes/#{vote_id}/ballots",
         params: json_payload(user_id: @owner.id, vote_option_id: first_option_id),
         headers: @owner_headers
    assert_response :unprocessable_entity
    assert_match(/ja votou/, json_response.fetch("error").join(" "))

    post "/api/v1/votes/#{vote_id}/ballots",
         params: json_payload(user_id: @admin.id, vote_option_id: first_option_id),
         headers: @owner_headers
    assert_response :forbidden

    get "/api/v1/votes/#{vote_id}/result", headers: @admin_headers
    assert_response :success
    assert_equal 1, json_response.fetch("ballots").size
    assert_equal 5.0, json_response.fetch("summary").first.fetch("weight_total")

    patch "/api/v1/votes/#{vote_id}/finish", headers: @admin_headers
    assert_response :success
    assert_equal "closed", json_response.fetch("status")

    patch "/api/v1/meetings/#{@meeting.id}/finish", headers: @admin_headers
    assert_response :success

    get "/api/v1/votes/#{vote_id}/export_pdf", headers: @admin_headers
    assert_response :success
    assert_equal "application/pdf", response.media_type

    get "/api/v1/votes/#{vote_id}/export_xlsx", headers: @admin_headers
    assert_response :success
    assert_equal "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", response.media_type
  end

  test "meeting access log and managerial report endpoints work after presence is recorded" do
    @meeting.start!

    post "/api/v1/meetings/#{@meeting.id}/join",
         params: json_payload(user_id: @owner.id),
         headers: @owner_headers
    assert_response :created

    post "/api/v1/meetings/#{@meeting.id}/leave",
         params: json_payload(user_id: @owner.id),
         headers: @owner_headers
    assert_response :success

    get "/api/v1/meetings/#{@meeting.id}/access_log", headers: @admin_headers
    assert_response :success
    assert_equal "text/html", response.media_type
    assert_includes response.body, "Entrada na reuniao"
    assert_includes response.body, "Saida da reuniao"

    @meeting.update!(status: :finished, finished_at: Time.current)

    get "/api/v1/meetings/#{@meeting.id}/managerial_report", headers: @admin_headers
    assert_response :success
    assert_equal "application/pdf", response.media_type
  end

  test "vote is closed automatically when it expires" do
    @meeting.start!
    vote = @meeting.votes.create!(
      agenda_item: @agenda_item,
      statement: "Votacao com expiracao automatica",
      response_type: :yes_no_abstain,
      visibility: :open_vote,
      duration_minutes: 1
    )

    vote.start!
    travel 2.minutes
    perform_enqueued_jobs

    assert vote.reload.closed?
  end

  test "destroy vote works when it has no ballots" do
    vote = @meeting.votes.create!(
      agenda_item: @agenda_item,
      statement: "Votacao removivel",
      response_type: :yes_no_abstain,
      visibility: :secret_vote,
      duration_minutes: 2
    )

    delete "/api/v1/votes/#{vote.id}", headers: @admin_headers
    assert_response :no_content
  end

  test "not found and validation errors return json" do
    get "/api/v1/condominiums/999999", headers: @admin_headers
    assert_response :not_found
    assert json_response.fetch("error").present?

    post "/api/v1/condominiums",
         params: json_payload(condominium: { name: "" }),
         headers: @admin_headers
    assert_response :unprocessable_entity
    assert json_response.fetch("error").any?
  end
end
