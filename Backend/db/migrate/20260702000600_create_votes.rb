class CreateVotes < ActiveRecord::Migration[7.2]
  def change
    create_table :votes do |t|
      t.references :meeting, null: false, foreign_key: true
      t.references :agenda_item, null: false, foreign_key: true
      t.text :statement, null: false
      t.integer :response_type, null: false, default: 0
      t.integer :visibility, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.integer :duration_minutes, null: false, default: 2
      t.datetime :started_at
      t.datetime :closes_at
      t.datetime :closed_at

      t.timestamps
    end
  end
end

