class MeetingUser < ApplicationRecord
  belongs_to :meeting
  belongs_to :user

  validates :user_id, uniqueness: { scope: :meeting_id }
end

