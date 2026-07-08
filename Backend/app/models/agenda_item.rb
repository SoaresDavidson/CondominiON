class AgendaItem < ApplicationRecord
  belongs_to :meeting
  has_many :votes
  has_one_attached :attachment

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :meeting_id }
  validate :attachment_must_be_pdf

  before_destroy :clear_inactive_votes_or_abort

  private

  def attachment_must_be_pdf
    return unless attachment.attached?

    if attachment.blob.content_type != "application/pdf" && attachment.blob.filename.extension.downcase != "pdf"
      errors.add(:attachment, "deve ser um arquivo PDF")
    end
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
