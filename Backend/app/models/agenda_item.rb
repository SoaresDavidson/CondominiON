class AgendaItem < ApplicationRecord
  belongs_to :meeting
  has_many :votes

  validates :title, presence: true
  validates :position, numericality: { only_integer: true, greater_than: 0 }, uniqueness: { scope: :meeting_id }

  before_destroy :clear_inactive_votes_or_abort

  private

  def clear_inactive_votes_or_abort
    if votes.active.exists?
      errors.add(:base, "nao e possivel excluir uma pauta com votacao ativa")
      throw :abort
    else
      votes.destroy_all
    end
  end
end

