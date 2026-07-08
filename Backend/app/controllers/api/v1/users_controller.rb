module Api
  module V1
    class UsersController < BaseController
      before_action :set_condominium, only: %i[index create]
      before_action :set_user, only: %i[show update destroy]
      before_action -> { authorize_roles!("administrator") }, only: %i[index create update destroy]
      before_action -> { authorize_condominium_scope!(@condominium) }, only: %i[index create]
      before_action -> { authorize_condominium_scope!(@user.condominium) }, only: %i[update destroy]
      before_action :authorize_show!, only: :show

      def index
        users = @condominium.users.order(created_at: :desc)
        users = users.where(role: params[:role]) if params[:role].present?
        users = users.where("name ILIKE ?", "%#{params[:name]}%") if params[:name].present?
        users = users.where("email ILIKE ?", "%#{params[:email]}%") if params[:email].present?

        render json: users
      end

      def show
        render json: @user
      end

      def create
        user = @condominium.users.new(user_params)
        initial_credential = assign_initial_credential(user)
        user.save!
        deliver_credential_email(user, initial_credential)

        payload = user.as_json
        unless Rails.env.production?
          payload[:initial_password] = initial_credential if user.administrator? || user.owner?
          payload[:access_token] = user.access_token if user.guest? || user.proxy?
        end

        render json: payload, status: :created
      end

      def update
        @user.update!(user_params.except(:role))
        render json: @user
      end

      def destroy
        @user.update!(active: false)
        render json: @user
      end

      private

      def set_condominium
        @condominium = Condominium.find(params[:condominium_id])
      end

      def set_user
        @user = User.find(params[:id])
      end

      def authorize_show!
        return if current_user.administrator? || current_user.id == @user.id

        render json: { error: "acesso negado para este perfil" }, status: :forbidden
      end

      def user_params
        params.require(:user).permit(
          :name,
          :email,
          :role,
          :lots_count,
          :houses_count,
          :active,
          :delinquent,
          :proxy_for_id,
          :meeting_id
        )
      end

      # Gera senha inicial (administrator/owner) ou access_token (guest/proxy, feito pelo model).
      def assign_initial_credential(user)
        return nil unless user.administrator? || user.owner?

        password = SecureRandom.hex(6)
        user.password = password
        password
      end

      def deliver_credential_email(user, initial_credential)
        if user.administrator? || user.owner?
          UserMailer.welcome_email(user, initial_credential).deliver_later
        elsif user.guest? || user.proxy?
          UserMailer.access_invitation_email(user).deliver_later
        end
      end
    end
  end
end

