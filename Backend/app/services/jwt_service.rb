class JwtService
  ALGORITHM = "HS256".freeze

  InvalidToken = Class.new(StandardError)

  def self.encode(payload, exp: 24.hours.from_now, jti: SecureRandom.uuid)
    body = payload.merge(exp: exp.to_i, jti:)
    JWT.encode(body, secret, ALGORITHM)
  end

  def self.decode(token)
    body = JWT.decode(token, secret, true, algorithm: ALGORITHM).first
    body.with_indifferent_access
  rescue JWT::DecodeError => e
    raise InvalidToken, e.message
  end

  def self.secret
    Rails.application.secret_key_base
  end
end
