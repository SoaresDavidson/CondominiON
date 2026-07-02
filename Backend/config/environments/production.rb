Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.active_record.dump_schema_after_migration = false
  config.force_ssl = ENV.fetch("RAILS_FORCE_SSL", "false") == "true"
end

