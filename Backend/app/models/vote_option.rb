class VoteOption < ApplicationRecord
  belongs_to :vote
  has_many :ballots, dependent: :restrict_with_error

  validates :description, presence: true
  validates :position, numericality: { only_integer: true, greater_than: 0 }
end

