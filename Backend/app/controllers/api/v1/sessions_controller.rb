module Api
  module V1
    class SessionsController < ApplicationController
      include Authenticatable

      before_action :authenticate_request!, only: :destroy

      def create
        user = User.active.where(role: %i[administrator owner])
                    .find_by(email: params[:email].to_s.strip.downcase)

        return render json: { error: "email ou senha invalidos" }, status: :unauthorized if user.blank?
        return render json: { error: "email ou senha invalidos" }, status: :unauthorized unless user.authenticate(params[:password].to_s)

        token = JwtService.encode({ user_id: user.id })
        render json: { token:, user: user.as_json }, status: :created
      end

      def destroy
        current_user.update!(active_session_token: nil) if current_user.guest? || current_user.proxy?
        head :no_content
      end
    end
  end
end
