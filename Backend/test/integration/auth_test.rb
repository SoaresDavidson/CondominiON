require "test_helper"

class AuthTest < ActionDispatch::IntegrationTest
  setup do
    @condominium = Condominium.create!(name: "Residencial Auth", address: "Rua B")
    @admin = @condominium.users.create!(
      name: "Admin Auth",
      email: "admin.auth@example.com",
      role: :administrator,
      password: "senha123456"
    )
    @meeting = @condominium.meetings.create!(
      title: "Reuniao Auth",
      starts_at: 1.day.from_now,
      meeting_type: :with_guests
    )
    @guest = @condominium.users.create!(
      name: "Convidado Auth",
      email: "guest.auth@example.com",
      role: :guest,
      meeting: @meeting
    )
  end

  test "login with valid credentials returns a token" do
    post "/api/v1/sessions",
         params: json_payload(email: @admin.email, password: "senha123456"),
         headers: json_headers
    assert_response :created
    assert json_response.fetch("token").present?
    assert_equal @admin.id, json_response.fetch("user").fetch("id")
  end

  test "login with invalid password is rejected" do
    post "/api/v1/sessions",
         params: json_payload(email: @admin.email, password: "senha-errada"),
         headers: json_headers
    assert_response :unauthorized
  end

  test "login with unknown email is rejected" do
    post "/api/v1/sessions",
         params: json_payload(email: "ninguem@example.com", password: "qualquer"),
         headers: json_headers
    assert_response :unauthorized
  end

  test "guest exchanges access token for a jwt scoped to their meeting" do
    post "/api/v1/meeting_accesses",
         params: json_payload(access_token: @guest.access_token),
         headers: json_headers
    assert_response :created
    token = json_response.fetch("token")

    get "/api/v1/meetings/#{@meeting.id}",
        headers: json_headers.merge("Authorization" => "Bearer #{token}")
    assert_response :success
  end

  test "invalid access token is rejected" do
    post "/api/v1/meeting_accesses",
         params: json_payload(access_token: "token-invalido"),
         headers: json_headers
    assert_response :unauthorized
  end

  test "a new guest login invalidates the previous session token" do
    post "/api/v1/meeting_accesses",
         params: json_payload(access_token: @guest.access_token),
         headers: json_headers
    first_token = json_response.fetch("token")

    post "/api/v1/meeting_accesses",
         params: json_payload(access_token: @guest.access_token),
         headers: json_headers
    assert_response :created

    get "/api/v1/meetings/#{@meeting.id}",
        headers: json_headers.merge("Authorization" => "Bearer #{first_token}")
    assert_response :unauthorized
  end

  test "requests with expired or malformed tokens are rejected" do
    get "/api/v1/condominiums", headers: json_headers.merge("Authorization" => "Bearer not-a-real-token")
    assert_response :unauthorized
  end

  test "password reset flow issues a token and allows redefining the password" do
    post "/api/v1/password_resets",
         params: json_payload(email: @admin.email),
         headers: json_headers
    assert_response :success
    reset_token = json_response.fetch("reset_token")
    assert reset_token.present?

    patch "/api/v1/password_resets/#{reset_token}",
          params: json_payload(password: "novasenha123"),
          headers: json_headers
    assert_response :success

    post "/api/v1/sessions",
         params: json_payload(email: @admin.email, password: "novasenha123"),
         headers: json_headers
    assert_response :created
  end

  test "password reset request for unknown email returns a generic success message" do
    post "/api/v1/password_resets",
         params: json_payload(email: "ninguem@example.com"),
         headers: json_headers
    assert_response :success
    assert_nil json_response.fetch("reset_token")
  end

  test "password reset with invalid token is rejected" do
    patch "/api/v1/password_resets/token-invalido",
          params: json_payload(password: "novasenha123"),
          headers: json_headers
    assert_response :unprocessable_entity
  end
end
