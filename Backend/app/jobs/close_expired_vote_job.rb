class CloseExpiredVoteJob < ApplicationJob
  queue_as :default

  def perform(vote_id)
    vote = Vote.find_by(id: vote_id)
    return if vote.blank? || !vote.active?
    return if vote.closes_at.present? && vote.closes_at > Time.current

    vote.finish!
  end
end
