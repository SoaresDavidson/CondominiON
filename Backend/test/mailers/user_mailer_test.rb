require "test_helper"

class UserMailerTest < ActionMailer::TestCase
  setup do
    @condominium = Condominium.create!(name: "Residencial Teste", address: "Rua A")
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
      meeting_type: :with_guests
    )
  end

  test "welcome_email" do
    mail = UserMailer.welcome_email(@owner, "senhainicial")

    assert_equal [@owner.email], mail.to
    assert_match "senha inicial", mail.subject
    assert_match "senhainicial", mail.text_part.body.to_s
    assert_match "senhainicial", mail.html_part.body.to_s
  end

  test "access_invitation_email" do
    guest = @condominium.users.create!(name: "Convidado", email: "convidado@example.com", role: :guest, meeting: @meeting)

    mail = UserMailer.access_invitation_email(guest)

    assert_equal [guest.email], mail.to
    assert_match @meeting.title, mail.subject
    assert_match guest.access_token, mail.text_part.body.to_s
  end

  test "meeting_reminder_email" do
    mail = UserMailer.meeting_reminder_email(@owner, @meeting)

    assert_equal [@owner.email], mail.to
    assert_match @meeting.title, mail.subject
  end

  test "password_reset_email" do
    @owner.update!(reset_password_token: "abc123", reset_password_sent_at: Time.current)

    mail = UserMailer.password_reset_email(@owner)

    assert_equal [@owner.email], mail.to
    assert_match "abc123", mail.text_part.body.to_s
  end
end
