require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module CondominioBackend
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true
    config.active_job.queue_adapter = :async
    config.active_storage.service = :local

    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins(*ENV.fetch("RAILS_CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","))
        resource "*", headers: :any, methods: %i[get post put patch delete options head]
      end
    end
  end
end
