class AddPositionToAgendaItems < ActiveRecord::Migration[7.2]
  def change
    add_column :agenda_items, :position, :integer, null: false, default: 1

    add_index :agenda_items, %i[meeting_id position], unique: true
  end
end
