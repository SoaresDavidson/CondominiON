module Api
  module V1
    class CondominiumsController < BaseController
      before_action :set_condominium, only: %i[show update destroy]
      before_action -> { authorize_roles!("administrator") }, only: %i[create update destroy]
      before_action -> { authorize_condominium_scope!(@condominium) }, only: %i[show update destroy]

      def index
        scope = current_user.administrator? ? Condominium.all : Condominium.where(id: current_user.condominium_id)
        render json: scope.order(:name)
      end

      def show
        render json: @condominium
      end

      def create
        render_created Condominium.create!(condominium_params)
      end

      def update
        @condominium.update!(condominium_params)
        render json: @condominium
      end

      def destroy
        @condominium.destroy!
        head :no_content
      end

      private

      def set_condominium
        @condominium = Condominium.find(params[:id])
      end

      def condominium_params
        params.require(:condominium).permit(:name, :address)
      end
    end
  end
end

