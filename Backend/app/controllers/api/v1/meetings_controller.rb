module Api
  module V1
    class MeetingsController < ApplicationController
      before_action :set_condominium, only: %i[index create]
      before_action :set_meeting, only: %i[show update destroy start finish cancel join send_invitations]

      def index
        meetings = @condominium.meetings.order(starts_at: :desc)
        meetings = meetings.where(status: params[:status]) if params[:status].present?
        meetings = meetings.where(meeting_type: params[:meeting_type]) if params[:meeting_type].present?
        meetings = meetings.where("title ILIKE ?", "%#{params[:title]}%") if params[:title].present?

        render json: meetings
      end

      def show
        render json: @meeting.as_json(include: %i[agenda_items votes])
      end

      def create
        render_created @condominium.meetings.create!(meeting_params)
      end

      def update
        @meeting.update!(meeting_params)
        render json: @meeting
      end

      def destroy
        @meeting.destroy!
        head :no_content
      end

      def start
        @meeting.start!
        render json: @meeting
      end

      def finish
        @meeting.finish!
        render json: @meeting
      end

      def cancel
        @meeting.cancel!
        render json: @meeting
      end

      def join
        user = @meeting.condominium.users.find(params.require(:user_id))
        presence = @meeting.meeting_users.find_or_create_by!(user:) do |record|
          record.joined_at = Time.current
        end

        render json: presence.as_json(include: :user), status: :created
      end

      def send_invitations
        render json: {
          meeting_id: @meeting.id,
          status: "queued",
          total_recipients: params.fetch(:total_recipients, 0).to_i
        }, status: :accepted
      end

      private

      def set_condominium
        @condominium = Condominium.find(params[:condominium_id])
      end

      def set_meeting
        @meeting = Meeting.find(params[:id])
      end

      def meeting_params
        params.require(:meeting).permit(:title, :starts_at, :meeting_type, :status)
      end
    end
  end
end

