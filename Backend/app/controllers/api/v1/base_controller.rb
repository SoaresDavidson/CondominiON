module Api
  module V1
    class BaseController < ApplicationController
      include Authenticatable

      before_action :authenticate_request!
    end
  end
end
