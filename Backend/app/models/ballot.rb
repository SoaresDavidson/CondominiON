class Ballot < ApplicationRecord
  belongs_to :vote
  belongs_to :vote_option
  belongs_to :user

  validates :user_id, uniqueness: { scope: :vote_id, message: "ja votou nesta votacao" }
  validate :vote_must_be_active
  validate :option_must_belong_to_vote
  validate :user_must_be_present

  before_validation :copy_user_weight

  private

  def copy_user_weight
    self.weight = user&.vote_weight.to_f
  end

  def vote_must_be_active
    errors.add(:vote, "precisa estar ativa") unless vote&.active?
  end

  def option_must_belong_to_vote
    return if vote_option.blank? || vote.blank? || vote_option.vote_id == vote_id

    errors.add(:vote_option, "nao pertence a votacao")
  end

  def user_must_be_present
    return if vote.blank? || user.blank?

    present = MeetingUser.exists?(meeting_id: vote.meeting_id, user_id:)
    errors.add(:user, "precisa estar presente na reuniao") unless present
  end
end

