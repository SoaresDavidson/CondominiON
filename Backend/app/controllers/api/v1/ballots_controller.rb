module Api
  module V1
    class BallotsController < BaseController
      before_action :set_vote
      before_action -> { authorize_meeting_scope!(@vote.meeting) }
      before_action -> { authorize_roles!("administrator") }, only: :index
      before_action :authorize_own_ballot!, only: :create

      def index
        render json: @vote.ballots.includes(:user, :vote_option).map { |ballot| ballot_payload(ballot) }
      end

      def create
        ballot = @vote.ballots.create!(
          user_id: params.require(:user_id),
          vote_option_id: params.require(:vote_option_id),
          cast_at: Time.current,
          ip_address: request.remote_ip,
          user_agent: request.user_agent
        )

        render json: ballot_payload(ballot), status: :created
      end

      private

      def set_vote
        @vote = Vote.find(params[:vote_id])
      end

      def authorize_own_ballot!
        return if params[:user_id].to_i == current_user.id

        render json: { error: "so e possivel votar em nome do proprio usuario" }, status: :forbidden
      end

      def ballot_payload(ballot)
        {
          id: ballot.id,
          vote_id: ballot.vote_id,
          vote_option_id: ballot.vote_option_id,
          user_id: ballot.user_id,
          weight: ballot.weight.to_f,
          cast_at: ballot.cast_at
        }
      end
    end
  end
end
