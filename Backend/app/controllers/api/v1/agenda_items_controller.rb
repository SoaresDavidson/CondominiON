module Api
  module V1
    class AgendaItemsController < ApplicationController
      before_action :set_meeting, only: %i[index create]
      before_action :set_agenda_item, only: %i[show update destroy]

      def index
        render json: @meeting.agenda_items.order(:created_at)
      end

      def show
        render json: @agenda_item
      end

      def create
        render_created @meeting.agenda_items.create!(agenda_item_params)
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
        params.require(:agenda_item).permit(:title, :description, :attachment_url)
      end
    end
  end
end

