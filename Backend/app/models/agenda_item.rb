class AgendaItem < ApplicationRecord
  belongs_to :meeting
  has_many :votes, dependent: :restrict_with_error

  validates :title, presence: true
end

