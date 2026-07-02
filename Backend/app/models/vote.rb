class Vote < ApplicationRecord
  belongs_to :meeting
  belongs_to :agenda_item
  has_many :vote_options, dependent: :destroy
  has_many :ballots, dependent: :destroy

  enum :response_type, {
    yes_no_abstain: 0,
    multiple_choice: 1,
    name_election: 2
  }

  enum :visibility, {
    open_vote: 0,
    secret_vote: 1
  }

  enum :status, {
    waiting: 0,
    active: 1,
    closed: 2
  }

  validates :statement, :response_type, :visibility, :status, presence: true
  validates :duration_minutes, numericality: { only_integer: true, greater_than: 0 }
  validate :agenda_item_must_belong_to_meeting

  def start!
    errors.add(:base, "a reuniao precisa estar em andamento") unless meeting.in_progress?
    errors.add(:base, "a votacao precisa estar aguardando") unless waiting?
    raise ActiveRecord::RecordInvalid, self if errors.any?

    transaction do
      create_default_options! if yes_no_abstain? && vote_options.empty?
      update!(status: :active, started_at: Time.current, closes_at: duration_minutes.minutes.from_now)
    end
  end

  def finish!
    update!(status: :closed, closed_at: Time.current)
  end

  def result
    total_weight = ballots.sum(:weight)
    vote_options.left_joins(:ballots).group("vote_options.id").select(
      "vote_options.*",
      "COUNT(ballots.id) AS ballots_count",
      "COALESCE(SUM(ballots.weight), 0) AS weight_total"
    ).map do |option|
      weight = option.weight_total.to_f
      {
        option_id: option.id,
        description: option.description,
        ballots_count: option.ballots_count.to_i,
        weight_total: weight,
        weight_percentage: total_weight.positive? ? ((weight / total_weight) * 100).round(2).to_f : 0
      }
    end
  end

  private

  def agenda_item_must_belong_to_meeting
    return if agenda_item.blank? || meeting.blank? || agenda_item.meeting_id == meeting_id

    errors.add(:agenda_item, "deve pertencer a reuniao selecionada")
  end

  def create_default_options!
    %w[Sim Nao Abstencao].each_with_index do |description, index|
      vote_options.create!(description:, position: index + 1)
    end
  end
end
