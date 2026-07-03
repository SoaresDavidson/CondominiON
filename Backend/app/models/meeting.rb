class Meeting < ApplicationRecord
  belongs_to :condominium
  has_many :agenda_items, dependent: :destroy
  has_many :votes, dependent: :destroy
  has_many :meeting_users, dependent: :destroy
  has_many :users, through: :meeting_users

  enum :meeting_type, {
    administrators_only: 0,
    with_owners: 1,
    with_guests: 2
  }

  enum :status, {
    scheduled: 0,
    in_progress: 1,
    canceled: 2,
    finished: 3
  }

  validates :title, :starts_at, :meeting_type, :status, presence: true
  validate :starts_at_cannot_be_in_the_past, on: :create

  def start!
    errors.add(:base, "reuniao precisa estar agendada") unless scheduled?
    errors.add(:starts_at, "reuniao nao pode ser iniciada com mais de 10 minutos de antecedencia") if starts_at > 10.minutes.from_now
    raise ActiveRecord::RecordInvalid, self if errors.any?

    update!(status: :in_progress)
  end

  def finish!
    errors.add(:base, "existem votacoes ativas ou aguardando encerramento") if votes.where(status: %i[waiting active]).exists?
    raise ActiveRecord::RecordInvalid, self if errors.any?

    update!(status: :finished, finished_at: Time.current)
  end

  def cancel!
    raise ActiveRecord::RecordInvalid, self unless scheduled?

    update!(status: :canceled)
  end

  private

  def starts_at_cannot_be_in_the_past
    errors.add(:starts_at, "nao pode estar no passado") if starts_at.present? && starts_at < Time.current
  end
end

