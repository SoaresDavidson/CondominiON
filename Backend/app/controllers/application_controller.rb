class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from ActiveRecord::RecordNotDestroyed, with: :not_destroyed

  private

  def render_created(record)
    render json: record.as_json, status: :created
  end

  def not_found(error)
    render json: { error: error.message }, status: :not_found
  end

  def unprocessable_entity(error)
    render json: { error: error.record.errors.full_messages }, status: :unprocessable_entity
  end

  def not_destroyed(error)
    render json: { error: error.record.errors.full_messages }, status: :unprocessable_entity
  end
end

