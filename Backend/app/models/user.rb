class User < ApplicationRecord
  has_secure_password validations: false

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

  scope :active, -> { where(active: true) }

  validates :name, :email, :role, presence: true
  validates :email, uniqueness: { scope: :condominium_id }
  validates :lots_count, :houses_count, numericality: { greater_than_or_equal_to: 0 }
  validates :password, length: { minimum: 6 }, allow_nil: true
  validates :proxy_for, presence: true, if: :proxy?
  validates :meeting, presence: true, if: -> { proxy? || guest? }
  validate :proxy_for_must_be_adimplent, if: :proxy?

  before_validation :normalize_email
  before_validation :calculate_vote_weight
  before_validation :assign_access_token, if: -> { (guest? || proxy?) && access_token.blank? }

  def as_json(options = {})
    super({
      except: %i[created_at updated_at password_digest active_session_token reset_password_token],
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

  def assign_access_token
    self.access_token = SecureRandom.hex(16)
  end

  def proxy_for_must_be_adimplent
    return if proxy_for.blank? || !proxy_for.delinquent?

    errors.add(:proxy_for, "precisa estar adimplente para ter procurador")
  end
end
