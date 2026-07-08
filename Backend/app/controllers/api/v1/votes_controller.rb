module Api
  module V1
    class VotesController < BaseController
      before_action :set_meeting, only: %i[index create]
      before_action :set_vote, only: %i[show update destroy start finish result export_pdf export_xlsx]
      before_action -> { authorize_meeting_scope!(@meeting) }, only: %i[index create]
      before_action -> { authorize_meeting_scope!(@vote.meeting) }, only: %i[show update destroy start finish result export_pdf export_xlsx]
      before_action -> { authorize_roles!("administrator") }, only: %i[create update destroy start finish export_pdf export_xlsx]

      def index
        votes = @meeting.votes.includes(:agenda_item, :vote_options).order(:created_at)
        votes = votes.where(status: params[:status]) if params[:status].present?
        votes = votes.where(response_type: params[:response_type]) if params[:response_type].present?
        votes = votes.where(visibility: params[:visibility]) if params[:visibility].present?

        render json: votes.as_json(include: %i[agenda_item vote_options])
      end

      def show
        render json: @vote.as_json(include: %i[agenda_item vote_options])
      end

      def create
        vote = nil

        Vote.transaction do
          vote = @meeting.votes.create!(vote_params)
          Array(params[:options]).each_with_index do |description, index|
            vote.vote_options.create!(description:, position: index + 1)
          end
        end

        render json: vote.as_json(include: :vote_options), status: :created
      end

      def update
        @vote.update!(vote_params)
        render json: @vote.as_json(include: :vote_options)
      end

      def destroy
        @vote.destroy!
        head :no_content
      end

      def start
        @vote.start!
        render json: @vote.as_json(include: :vote_options)
      end

      def finish
        @vote.finish!
        render json: @vote.as_json(include: :vote_options)
      end

      def result
        render json: {
          vote: @vote,
          summary: @vote.result,
          ballots: visible_ballots
        }
      end

      def export_pdf
        return render_unavailable_document unless @vote.meeting.finished?

        pdf = VoteResultPdf.new(@vote).render
        send_data pdf,
                  filename: "resultado-votacao-#{@vote.id}.pdf",
                  type: "application/pdf",
                  disposition: "attachment"
      end

      def export_xlsx
        return render_unavailable_document unless @vote.meeting.finished?

        xlsx = VoteResultSpreadsheet.new(@vote).render
        send_data xlsx,
                  filename: "resultado-votacao-#{@vote.id}.xlsx",
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  disposition: "attachment"
      end

      private

      def set_meeting
        @meeting = Meeting.find(params[:meeting_id])
      end

      def set_vote
        @vote = Vote.find(params[:id])
      end

      def vote_params
        params.require(:vote).permit(
          :agenda_item_id,
          :statement,
          :response_type,
          :visibility,
          :status,
          :duration_minutes
        )
      end

      def visible_ballots
        return [] if @vote.secret_vote?

        @vote.ballots.includes(:user, :vote_option).map do |ballot|
          {
            id: ballot.id,
            user: ballot.user.slice(:id, :name, :email),
            option: ballot.vote_option.description,
            weight: ballot.weight.to_f,
            cast_at: ballot.cast_at
          }
        end
      end

      def render_unavailable_document
        render json: { error: "documentos disponiveis apenas apos a reuniao ser finalizada" }, status: :unprocessable_entity
      end
    end
  end
end
