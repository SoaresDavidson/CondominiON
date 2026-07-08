class AccessLog < ApplicationRecord
  belongs_to :meeting
  belongs_to :user

  enum :event, {
    join: 0,
    leave: 1
  }, prefix: true

  validates :event, :occurred_at, presence: true
end
