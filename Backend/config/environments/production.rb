Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.active_record.dump_schema_after_migration = false
  config.force_ssl = ENV.fetch("RAILS_FORCE_SSL", "false") == "true"

  config.active_storage.service = :local

  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default_url_options = { host: ENV.fetch("BACKEND_HOST", "localhost"), protocol: "https" }
  config.action_mailer.smtp_settings = {
    address: ENV.fetch("SMTP_ADDRESS", "localhost"),
    port: ENV.fetch("SMTP_PORT", 587).to_i,
    domain: ENV["SMTP_DOMAIN"],
    user_name: ENV["SMTP_USERNAME"],
    password: ENV["SMTP_PASSWORD"],
    authentication: ENV.fetch("SMTP_AUTHENTICATION", "plain").to_sym,
    enable_starttls_auto: true
  }
end

