class User < ApplicationRecord
  belongs_to :condominium
  belongs_to :proxy_for, class_name: "User", optional: true
  belongs_to :meeting, optional: true

  has_many :represented_users, class_name: "User", foreign_key: :proxy_for_id, dependent: :nullify
  has_many :ballots, dependent: :restrict_with_error

  enum :role, {
    administrator: 0,
    owner: 1,
    proxy: 2,
    guest: 3
  }

  validates :name, :email, :role, presence: true
  validates :email, uniqueness: { scope: :condominium_id }
  validates :lots_count, :houses_count, numericality: { greater_than_or_equal_to: 0 }
  validates :proxy_for, presence: true, if: :proxy?
  validates :meeting, presence: true, if: -> { proxy? || guest? }

  before_validation :normalize_email
  before_validation :calculate_vote_weight

  def as_json(options = {})
    super({
      except: %i[created_at updated_at],
      methods: %i[vote_weight]
    }.merge(options))
  end

  private

  def normalize_email
    self.email = email.to_s.strip.downcase
  end

  def calculate_vote_weight
    self.vote_weight =
      if owner?
        (lots_count.to_i * 2) + houses_count.to_i
      elsif proxy? && proxy_for.present?
        proxy_for.vote_weight
      else
        0
      end
  end
end
