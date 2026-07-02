require "test_helper"

class ApiV1RequestsTest < ActionDispatch::IntegrationTest
  setup do
    @condominium = Condominium.create!(name: "Residencial Teste", address: "Rua A")
    @admin = @condominium.users.create!(
      name: "Admin Teste",
      email: "admin@example.com",
      role: :administrator
    )
    @owner = @condominium.users.create!(
      name: "Maria Oliveira",
      email: "maria@example.com",
      role: :owner,
      lots_count: 2,
      houses_count: 1
    )
    @meeting = @condominium.meetings.create!(
      title: "Assembleia de Teste",
      starts_at: 2.days.from_now,
      meeting_type: :with_owners
    )
    @agenda_item = @meeting.agenda_items.create!(
      title: "Orcamento Anual",
      description: "Aprovacao do orcamento"
    )
  end

  test "healthcheck responds ok" do
    get "/health"

    assert_response :success
    assert_equal({ "status" => "ok" }, json_response)
  end

  test "condominiums endpoints create list show update and destroy" do
    get "/api/v1/condominiums"
    assert_response :success
    assert_includes json_response.map { |item| item["name"] }, "Residencial Teste"

    post "/api/v1/condominiums",
         params: json_payload(condominium: { name: "Condominio Novo", address: "Rua Nova" }),
         headers: json_headers
    assert_response :created
    created_id = json_response.fetch("id")

    get "/api/v1/condominiums/#{created_id}"
    assert_response :success
    assert_equal "Condominio Novo", json_response.fetch("name")

    patch "/api/v1/condominiums/#{created_id}",
          params: json_payload(condominium: { address: "Rua Atualizada" }),
          headers: json_headers
    assert_response :success
    assert_equal "Rua Atualizada", json_response.fetch("address")

    delete "/api/v1/condominiums/#{created_id}"
    assert_response :no_content
  end

  test "users endpoints create list show update and deactivate" do
    get "/api/v1/condominiums/#{@condominium.id}/users", params: { role: "owner" }
    assert_response :success
    assert_equal ["Maria Oliveira"], json_response.map { |user| user["name"] }

    post "/api/v1/condominiums/#{@condominium.id}/users",
         params: json_payload(user: {
           name: "Alexandre Ribas",
           email: "alexandre@example.com",
           role: "proxy",
           proxy_for_id: @owner.id,
           meeting_id: @meeting.id
         }),
         headers: json_headers
    assert_response :created
    proxy_id = json_response.fetch("id")
    assert_equal "proxy", json_response.fetch("role")
    assert_equal "5.0", json_response.fetch("vote_weight")

    get "/api/v1/users/#{proxy_id}"
    assert_response :success
    assert_equal "Alexandre Ribas", json_response.fetch("name")

    patch "/api/v1/users/#{proxy_id}",
          params: json_payload(user: { name: "Alexandre Ribas Atualizado", active: true }),
          headers: json_headers
    assert_response :success
    assert_equal "Alexandre Ribas Atualizado", json_response.fetch("name")

    delete "/api/v1/users/#{proxy_id}"
    assert_response :success
    assert_equal false, json_response.fetch("active")
  end

  test "meetings endpoints create list show update start cancel finish join and invitations" do
    get "/api/v1/condominiums/#{@condominium.id}/meetings", params: { status: "scheduled" }
    assert_response :success
    assert_includes json_response.map { |meeting| meeting["title"] }, "Assembleia de Teste"

    post "/api/v1/condominiums/#{@condominium.id}/meetings",
         params: json_payload(meeting: {
           title: "Reuniao Criada",
           starts_at: 3.days.from_now.iso8601,
           meeting_type: "with_guests"
         }),
         headers: json_headers
    assert_response :created
    meeting_id = json_response.fetch("id")

    get "/api/v1/meetings/#{meeting_id}"
    assert_response :success
    assert_equal "Reuniao Criada", json_response.fetch("title")

    patch "/api/v1/meetings/#{meeting_id}",
          params: json_payload(meeting: { title: "Reuniao Atualizada" }),
          headers: json_headers
    assert_response :success
    assert_equal "Reuniao Atualizada", json_response.fetch("title")

    post "/api/v1/meetings/#{meeting_id}/join",
         params: json_payload(user_id: @owner.id),
         headers: json_headers
    assert_response :created
    assert_equal @owner.id, json_response.fetch("user_id")

    post "/api/v1/meetings/#{meeting_id}/send_invitations",
         params: json_payload(total_recipients: 12),
         headers: json_headers
    assert_response :accepted
    assert_equal "queued", json_response.fetch("status")
    assert_equal 12, json_response.fetch("total_recipients")

    patch "/api/v1/meetings/#{meeting_id}/start", headers: json_headers
    assert_response :success
    assert_equal "in_progress", json_response.fetch("status")

    patch "/api/v1/meetings/#{meeting_id}/finish", headers: json_headers
    assert_response :success
    assert_equal "finished", json_response.fetch("status")

    cancelable = @condominium.meetings.create!(
      title: "Reuniao Cancelavel",
      starts_at: 4.days.from_now,
      meeting_type: :with_owners
    )
    patch "/api/v1/meetings/#{cancelable.id}/cancel", headers: json_headers
    assert_response :success
    assert_equal "canceled", json_response.fetch("status")

    removable = @condominium.meetings.create!(
      title: "Reuniao Removivel",
      starts_at: 5.days.from_now,
      meeting_type: :with_owners
    )
    delete "/api/v1/meetings/#{removable.id}"
    assert_response :no_content
  end

  test "agenda items endpoints create list show update and destroy" do
    get "/api/v1/meetings/#{@meeting.id}/agenda_items"
    assert_response :success
    assert_equal ["Orcamento Anual"], json_response.map { |item| item["title"] }

    post "/api/v1/meetings/#{@meeting.id}/agenda_items",
         params: json_payload(agenda_item: {
           title: "Eleicao Sindical",
           description: "Escolha do novo sindico",
           attachment_url: "https://example.com/edital.pdf"
         }),
         headers: json_headers
    assert_response :created
    agenda_item_id = json_response.fetch("id")

    get "/api/v1/agenda_items/#{agenda_item_id}"
    assert_response :success
    assert_equal "Eleicao Sindical", json_response.fetch("title")

    patch "/api/v1/agenda_items/#{agenda_item_id}",
          params: json_payload(agenda_item: { title: "Eleicao Atualizada" }),
          headers: json_headers
    assert_response :success
    assert_equal "Eleicao Atualizada", json_response.fetch("title")

    delete "/api/v1/agenda_items/#{agenda_item_id}"
    assert_response :no_content
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
         headers: json_headers
    assert_response :created
    vote_id = json_response.fetch("id")
    assert_equal 2, json_response.fetch("vote_options").size

    get "/api/v1/meetings/#{@meeting.id}/votes", params: { status: "waiting" }
    assert_response :success
    assert_includes json_response.map { |vote| vote["id"] }, vote_id

    get "/api/v1/votes/#{vote_id}"
    assert_response :success
    assert_equal "Voce aprova o orcamento?", json_response.fetch("statement")

    patch "/api/v1/votes/#{vote_id}",
          params: json_payload(vote: { duration_minutes: 4 }),
          headers: json_headers
    assert_response :success
    assert_equal 4, json_response.fetch("duration_minutes")

    get "/api/v1/votes/#{vote_id}/vote_options"
    assert_response :success
    first_option_id = json_response.first.fetch("id")

    post "/api/v1/votes/#{vote_id}/vote_options",
         params: json_payload(vote_option: { description: "Abster", position: 3 }),
         headers: json_headers
    assert_response :created
    created_option_id = json_response.fetch("id")

    get "/api/v1/vote_options/#{created_option_id}"
    assert_response :success
    assert_equal "Abster", json_response.fetch("description")

    patch "/api/v1/vote_options/#{created_option_id}",
          params: json_payload(vote_option: { description: "Abstencao" }),
          headers: json_headers
    assert_response :success
    assert_equal "Abstencao", json_response.fetch("description")

    delete "/api/v1/vote_options/#{created_option_id}"
    assert_response :no_content

    patch "/api/v1/votes/#{vote_id}/start", headers: json_headers
    assert_response :success
    assert_equal "active", json_response.fetch("status")

    get "/api/v1/votes/#{vote_id}/ballots"
    assert_response :success
    assert_equal [], json_response

    post "/api/v1/votes/#{vote_id}/ballots",
         params: json_payload(user_id: @owner.id, vote_option_id: first_option_id),
         headers: json_headers
    assert_response :created
    assert_equal 5.0, json_response.fetch("weight")

    post "/api/v1/votes/#{vote_id}/ballots",
         params: json_payload(user_id: @owner.id, vote_option_id: first_option_id),
         headers: json_headers
    assert_response :unprocessable_entity
    assert_match(/ja votou/, json_response.fetch("error").join(" "))

    get "/api/v1/votes/#{vote_id}/result"
    assert_response :success
    assert_equal 1, json_response.fetch("ballots").size
    assert_equal 5.0, json_response.fetch("summary").first.fetch("weight_total")

    patch "/api/v1/votes/#{vote_id}/finish", headers: json_headers
    assert_response :success
    assert_equal "closed", json_response.fetch("status")
  end

  test "destroy vote works when it has no ballots" do
    vote = @meeting.votes.create!(
      agenda_item: @agenda_item,
      statement: "Votacao removivel",
      response_type: :yes_no_abstain,
      visibility: :secret_vote,
      duration_minutes: 2
    )

    delete "/api/v1/votes/#{vote.id}"
    assert_response :no_content
  end

  test "not found and validation errors return json" do
    get "/api/v1/condominiums/999999"
    assert_response :not_found
    assert json_response.fetch("error").present?

    post "/api/v1/condominiums",
         params: json_payload(condominium: { name: "" }),
         headers: json_headers
    assert_response :unprocessable_entity
    assert json_response.fetch("error").any?
  end
end
