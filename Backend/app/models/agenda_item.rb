class AgendaItem < ApplicationRecord
  belongs_to :meeting
  has_many :votes
  has_one_attached :attachment

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :meeting_id }
  validate :attachment_must_be_pdf

  before_destroy :clear_inactive_votes_or_abort

  private

  # Checagem de metadados apenas (extensao/content-type), sem I/O de storage: o blob so e
  # efetivamente gravado no service no after_save do registro pai, entao ler o conteudo aqui
  # (em plena validacao) falharia com ActiveStorage::FileNotFoundError. A checagem de
  # assinatura de bytes (mais confiavel contra spoofing) e feita em AgendaItemsController
  # antes do attach, quando o IO bruto do upload ainda esta disponivel.
  def attachment_must_be_pdf
    return unless attachment.attached?

    correct_extension = attachment.blob.filename.extension.downcase == "pdf"
    correct_content_type = attachment.blob.content_type == "application/pdf"

    errors.add(:attachment, "deve ser um arquivo PDF") unless correct_extension && correct_content_type
  end

  def clear_inactive_votes_or_abort
    if votes.active.exists?
      errors.add(:base, "nao e possivel excluir uma pauta com votacao ativa")
      throw :abort
    else
      votes.destroy_all
    end
  end
end
