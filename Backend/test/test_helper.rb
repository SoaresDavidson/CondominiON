ENV["RAILS_ENV"] ||= "test"

require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  parallelize(workers: 1)
  self.use_transactional_tests = true
end

class ActionDispatch::IntegrationTest
  private

  def json_response
    JSON.parse(response.body)
  end

  def json_headers
    { "CONTENT_TYPE" => "application/json", "ACCEPT" => "application/json" }
  end

  def json_payload(payload)
    payload.to_json
  end
end

