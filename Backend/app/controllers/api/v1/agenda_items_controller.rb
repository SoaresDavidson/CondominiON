module Api
  module V1
    class AgendaItemsController < BaseController
      before_action :set_meeting, only: %i[index create]
      before_action :set_agenda_item, only: %i[show update destroy]
      before_action -> { authorize_meeting_scope!(@meeting) }, only: %i[index create]
      before_action -> { authorize_meeting_scope!(@agenda_item.meeting) }, only: %i[show update destroy]
      before_action -> { authorize_roles!("administrator") }, only: %i[create update destroy]

      def index
        render json: @meeting.agenda_items.order(:position)
      end

      def show
        render json: @agenda_item
      end

      def create
        attrs = agenda_item_params
        attrs[:position] ||= (@meeting.agenda_items.maximum(:position) || 0) + 1
        render_created @meeting.agenda_items.create!(attrs)
      end

      def update
        @agenda_item.update!(agenda_item_params)
        render json: @agenda_item
      end

      def destroy
        @agenda_item.destroy!
        head :no_content
      end

      private

      def set_meeting
        @meeting = Meeting.find(params[:meeting_id])
      end

      def set_agenda_item
        @agenda_item = AgendaItem.find(params[:id])
      end

      def agenda_item_params
        params.require(:agenda_item).permit(:title, :description, :attachment_url, :position)
      end
    end
  end
end

