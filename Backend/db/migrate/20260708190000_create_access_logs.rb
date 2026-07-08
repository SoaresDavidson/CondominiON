class CreateAccessLogs < ActiveRecord::Migration[7.2]
  def change
    create_table :access_logs do |t|
      t.references :meeting, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :event, null: false
      t.string :ip_address
      t.string :user_agent
      t.datetime :occurred_at, null: false

      t.timestamps
    end

    add_index :access_logs, %i[meeting_id occurred_at]
  end
end
