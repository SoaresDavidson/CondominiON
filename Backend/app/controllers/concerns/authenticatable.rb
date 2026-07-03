module Authenticatable
  extend ActiveSupport::Concern

  private

  def authenticate_request!
    token = bearer_token
    return render_unauthorized("token ausente") if token.blank?

    payload = JwtService.decode(token)
    user = User.find_by(id: payload[:user_id])
    return render_unauthorized("usuario invalido") if user.blank? || !user.active?

    if user.guest? || user.proxy?
      return render_unauthorized("sessao expirada") if user.active_session_token != payload[:jti]
    end

    @current_user = user
  rescue JwtService::InvalidToken
    render_unauthorized("token invalido")
  end

  def current_user
    @current_user
  end

  def authorize_roles!(*roles)
    return if roles.map(&:to_s).include?(current_user.role)

    render json: { error: "acesso negado para este perfil" }, status: :forbidden
  end

  def authorize_meeting_scope!(meeting)
    return unless current_user.guest? || current_user.proxy?
    return if current_user.meeting_id == meeting.id

    render json: { error: "acesso restrito a reuniao vinculada" }, status: :forbidden
  end

  def authorize_condominium_scope!(condominium)
    return if current_user.condominium_id == condominium.id

    render json: { error: "acesso restrito ao condominio do usuario" }, status: :forbidden
  end

  def bearer_token
    header = request.headers["Authorization"]
    return nil if header.blank?

    header.split(" ").last
  end

  def render_unauthorized(message)
    render json: { error: message }, status: :unauthorized
  end
end
