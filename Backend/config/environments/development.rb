Rails.application.configure do
  config.enable_reloading = true
  config.eager_load = false
  config.consider_all_requests_local = true
  config.server_timing = true
  config.active_record.migration_error = :page_load

  config.active_storage.service = :local

  config.action_mailer.delivery_method = :letter_opener_web
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.perform_caching = false
  config.action_mailer.default_url_options = { host: ENV.fetch("BACKEND_HOST", "localhost"), port: ENV.fetch("BACKEND_PORT", 3000) }
end

