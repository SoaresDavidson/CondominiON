module Api
  module V1
    class PasswordResetsController < ApplicationController
      TOKEN_VALID_FOR = 1.hour

      GENERIC_MESSAGE = "Se o e-mail estiver cadastrado, voce recebera um link de recuperacao.".freeze

      def create
        user = User.active.where(role: %i[administrator owner])
                    .find_by(email: params[:email].to_s.strip.downcase)

        if user.present?
          user.update!(reset_password_token: SecureRandom.hex(20), reset_password_sent_at: Time.current)
        end

        response_body = { message: GENERIC_MESSAGE }
        # TODO(Fase 4): enviar o token por e-mail em vez de devolve-lo na resposta.
        response_body[:reset_token] = user&.reset_password_token unless Rails.env.production?

        render json: response_body, status: :ok
      end

      def update
        user = User.where(reset_password_token: params[:token].to_s)
                    .where("reset_password_sent_at > ?", TOKEN_VALID_FOR.ago)
                    .first

        return render json: { error: "token invalido ou expirado" }, status: :unprocessable_entity if user.blank?

        user.update!(
          password: params[:password],
          reset_password_token: nil,
          reset_password_sent_at: nil
        )

        render json: { message: "senha redefinida com sucesso" }, status: :ok
      end
    end
  end
end
