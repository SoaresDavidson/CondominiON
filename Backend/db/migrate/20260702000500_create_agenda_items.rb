class CreateAgendaItems < ActiveRecord::Migration[7.2]
  def change
    create_table :agenda_items do |t|
      t.references :meeting, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :attachment_url

      t.timestamps
    end
  end
end

