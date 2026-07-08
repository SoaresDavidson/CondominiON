class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch("MAILER_FROM", "CondominiOn <no-reply@condominion.local>")
  layout "mailer"
end
