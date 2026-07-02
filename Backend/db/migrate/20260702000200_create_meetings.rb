class CreateMeetings < ActiveRecord::Migration[7.2]
  def change
    create_table :meetings do |t|
      t.references :condominium, null: false, foreign_key: true
      t.string :title, null: false
      t.datetime :starts_at, null: false
      t.integer :meeting_type, null: false, default: 1
      t.integer :status, null: false, default: 0
      t.datetime :finished_at

      t.timestamps
    end

    add_index :meetings, %i[condominium_id starts_at]
  end
end

