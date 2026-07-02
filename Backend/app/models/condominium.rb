class Condominium < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :meetings, dependent: :destroy

  validates :name, presence: true, uniqueness: true
end

