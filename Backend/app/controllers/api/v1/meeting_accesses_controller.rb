module Api
  module V1
    class MeetingAccessesController < ApplicationController
      def create
        user = User.active.where(role: %i[guest proxy])
                    .find_by(access_token: params[:access_token].to_s)

        return render json: { error: "token de acesso invalido" }, status: :unauthorized if user.blank?

        jti = SecureRandom.uuid
        token = JwtService.encode({ user_id: user.id, meeting_id: user.meeting_id }, jti:)
        user.update!(active_session_token: jti)

        render json: { token:, user: user.as_json }, status: :created
      end
    end
  end
end
