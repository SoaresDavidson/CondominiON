module Api
  module V1
    class AgendaItemsController < BaseController
      before_action :set_meeting, only: %i[index create]
      before_action :set_agenda_item, only: %i[show update destroy attachment]
      before_action -> { authorize_condominium_scope!(@meeting.condominium) }, only: %i[index create]
      before_action -> { authorize_condominium_scope!(@agenda_item.meeting.condominium) }, only: %i[show update destroy attachment]
      before_action -> { authorize_meeting_scope!(@meeting) }, only: %i[index create]
      before_action -> { authorize_meeting_scope!(@agenda_item.meeting) }, only: %i[show update destroy attachment]
      before_action -> { authorize_roles!("administrator") }, only: %i[create update destroy]

      def index
        render json: @meeting.agenda_items.order(:position).map { |item| agenda_item_payload(item) }
      end

      def show
        render json: agenda_item_payload(@agenda_item)
      end

      def create
        attrs = agenda_item_params
        attachment = attrs.delete(:attachment)
        attrs[:position] ||= (@meeting.agenda_items.maximum(:position) || 0) + 1
        item = @meeting.agenda_items.new(attrs)
        attach_pdf!(item, attachment) if attachment.present?
        item.save!

        render json: agenda_item_payload(item), status: :created
      end

      def update
        attrs = agenda_item_params
        attachment = attrs.delete(:attachment)
        @agenda_item.assign_attributes(attrs)
        attach_pdf!(@agenda_item, attachment) if attachment.present?
        @agenda_item.attachment.purge if params[:remove_attachment].to_s == "true"
        @agenda_item.save!

        render json: agenda_item_payload(@agenda_item)
      end

      def destroy
        @agenda_item.destroy!
        head :no_content
      end

      def attachment
        return render json: { error: "anexo nao encontrado" }, status: :not_found unless @agenda_item.attachment.attached?

        send_data @agenda_item.attachment.download,
                  filename: @agenda_item.attachment.filename.to_s,
                  type: @agenda_item.attachment.content_type,
                  disposition: "attachment"
      end

      private

      PDF_MAGIC_BYTES = "%PDF-".freeze

      # A checagem de assinatura de bytes precisa acontecer aqui, antes do attach, com o IO
      # bruto do upload: uma vez chamado item.attachment.attach(...), o blob so e gravado no
      # storage service no after_save do registro pai, entao tentar ler o conteudo de volta
      # (via attachment.download) durante uma validacao do model falha com
      # ActiveStorage::FileNotFoundError.
      def attach_pdf!(item, uploaded_file)
        unless valid_pdf_upload?(uploaded_file)
          item.errors.add(:attachment, "deve ser um arquivo PDF")
          raise ActiveRecord::RecordInvalid, item
        end

        item.attachment.attach(uploaded_file)
      end

      def valid_pdf_upload?(uploaded_file)
        return false unless uploaded_file.respond_to?(:read)

        extension_ok = File.extname(uploaded_file.original_filename.to_s).delete_prefix(".").downcase == "pdf"
        content_type_ok = uploaded_file.content_type == "application/pdf"

        uploaded_file.rewind
        signature = uploaded_file.read(PDF_MAGIC_BYTES.bytesize)
        uploaded_file.rewind

        extension_ok && content_type_ok && signature == PDF_MAGIC_BYTES
      end

      def set_meeting
        @meeting = Meeting.find(params[:meeting_id])
      end

      def set_agenda_item
        @agenda_item = AgendaItem.find(params[:id])
      end

      def agenda_item_params
        params.require(:agenda_item).permit(:title, :description, :attachment_url, :position, :attachment)
      end

      def agenda_item_payload(item)
        payload = item.as_json
        if item.attachment.attached?
          payload["attachment_url"] = api_v1_agenda_item_attachment_path(item)
          payload["attachment_filename"] = item.attachment.filename.to_s
          payload["attachment_content_type"] = item.attachment.content_type
          payload["attachment_byte_size"] = item.attachment.byte_size
        end
        payload
      end
    end
  end
end
