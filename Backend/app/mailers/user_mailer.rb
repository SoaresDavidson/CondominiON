class UserMailer < ApplicationMailer
  def welcome_email(user, password)
    @user = user
    @password = password
    @login_url = "#{frontend_url}/login"

    mail(to: @user.email, subject: "Bem-vindo ao CondominiOn — sua senha inicial")
  end

  def access_invitation_email(user, meeting: nil)
    @user = user
    @meeting = meeting || user.meeting
    @access_url = "#{frontend_url}/acesso/#{user.access_token}"

    mail(to: @user.email, subject: "CondominiOn — acesso a reuniao \"#{@meeting&.title}\"")
  end

  def meeting_reminder_email(user, meeting)
    @user = user
    @meeting = meeting
    @login_url = "#{frontend_url}/login"

    mail(to: @user.email, subject: "CondominiOn — convite para a reuniao \"#{meeting.title}\"")
  end

  def password_reset_email(user)
    @user = user
    @reset_url = "#{frontend_url}/redefinir-senha/#{user.reset_password_token}"

    mail(to: @user.email, subject: "CondominiOn — recuperacao de senha")
  end

  private

  def frontend_url
    ENV.fetch("FRONTEND_URL", "http://localhost:5173")
  end
end
