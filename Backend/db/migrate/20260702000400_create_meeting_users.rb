class CreateMeetingUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :meeting_users do |t|
      t.references :meeting, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :joined_at, null: false
      t.datetime :left_at

      t.timestamps
    end

    add_index :meeting_users, %i[meeting_id user_id], unique: true
  end
end

