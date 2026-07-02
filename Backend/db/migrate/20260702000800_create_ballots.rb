class CreateBallots < ActiveRecord::Migration[7.2]
  def change
    create_table :ballots do |t|
      t.references :vote, null: false, foreign_key: true
      t.references :vote_option, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.decimal :weight, precision: 10, scale: 2, null: false
      t.datetime :cast_at, null: false

      t.timestamps
    end

    add_index :ballots, %i[vote_id user_id], unique: true
  end
end
