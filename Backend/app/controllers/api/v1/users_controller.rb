module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_condominium, only: %i[index create]
      before_action :set_user, only: %i[show update destroy]

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
        render_created @condominium.users.create!(user_params)
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
    end
  end
end

