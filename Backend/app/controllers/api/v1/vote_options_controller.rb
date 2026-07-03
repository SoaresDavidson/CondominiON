module Api
  module V1
    class VoteOptionsController < BaseController
      before_action :set_vote, only: %i[index create]
      before_action :set_vote_option, only: %i[show update destroy]
      before_action -> { authorize_meeting_scope!(@vote.meeting) }, only: %i[index create]
      before_action -> { authorize_meeting_scope!(@vote_option.vote.meeting) }, only: %i[show update destroy]
      before_action -> { authorize_roles!("administrator") }, only: %i[create update destroy]

      def index
        render json: @vote.vote_options.order(:position)
      end

      def show
        render json: @vote_option
      end

      def create
        render_created @vote.vote_options.create!(vote_option_params)
      end

      def update
        @vote_option.update!(vote_option_params)
        render json: @vote_option
      end

      def destroy
        @vote_option.destroy!
        head :no_content
      end

      private

      def set_vote
        @vote = Vote.find(params[:vote_id])
      end

      def set_vote_option
        @vote_option = VoteOption.find(params[:id])
      end

      def vote_option_params
        params.require(:vote_option).permit(:description, :position)
      end
    end
  end
end

