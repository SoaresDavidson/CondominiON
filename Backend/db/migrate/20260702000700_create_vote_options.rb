class CreateVoteOptions < ActiveRecord::Migration[7.2]
  def change
    create_table :vote_options do |t|
      t.references :vote, null: false, foreign_key: true
      t.string :description, null: false
      t.integer :position, null: false, default: 1

      t.timestamps
    end

    add_index :vote_options, %i[vote_id position], unique: true
  end
end

