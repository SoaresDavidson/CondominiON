module Api
  module V1
    class MeetingsController < BaseController
      WRITE_ACTIONS = %i[create update destroy start finish cancel send_invitations].freeze

      before_action :set_condominium, only: %i[index create]
      before_action :set_meeting, only: %i[show update destroy start finish cancel join send_invitations]
      before_action -> { authorize_roles!("administrator") }, only: WRITE_ACTIONS
      before_action -> { authorize_condominium_scope!(@condominium) }, only: :create
      before_action -> { authorize_condominium_scope!(@meeting.condominium) },
                    only: %i[show update destroy start finish cancel send_invitations join]
      before_action -> { authorize_meeting_scope!(@meeting) }, only: %i[show join]
      before_action :authorize_join!, only: :join

      def index
        meetings = visible_meetings
        meetings = meetings.where(status: params[:status]) if params[:status].present?
        meetings = meetings.where(meeting_type: params[:meeting_type]) if params[:meeting_type].present?
        meetings = meetings.where("title ILIKE ?", "%#{params[:title]}%") if params[:title].present?

        render json: meetings.order(starts_at: :desc)
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
        return render json: { error: "tipo de usuario incompativel com o tipo da reuniao" }, status: :forbidden unless role_allowed_for_meeting?(user)

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

      def visible_meetings
        case current_user.role
        when "administrator"
          @condominium.meetings
        when "owner"
          @condominium.meetings.where(meeting_type: :with_owners)
        else
          @condominium.meetings.where(id: current_user.meeting_id, status: %i[scheduled in_progress])
        end
      end

      ROLE_HIERARCHY = { "administrators_only" => %w[administrator], "with_owners" => %w[administrator owner],
                          "with_guests" => %w[administrator owner proxy guest] }.freeze

      def role_allowed_for_meeting?(user)
        ROLE_HIERARCHY.fetch(@meeting.meeting_type).include?(user.role)
      end

      def authorize_join!
        return if params[:user_id].to_i == current_user.id
        return if current_user.administrator?

        render json: { error: "so e possivel registrar presenca do proprio usuario" }, status: :forbidden
      end
    end
  end
end

