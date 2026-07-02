class CreateUsers < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.references :condominium, null: false, foreign_key: true
      t.references :proxy_for, foreign_key: { to_table: :users }
      t.references :meeting, foreign_key: true
      t.string :name, null: false
      t.string :email, null: false
      t.integer :role, null: false, default: 1
      t.integer :lots_count, null: false, default: 0
      t.integer :houses_count, null: false, default: 0
      t.decimal :vote_weight, precision: 10, scale: 2, null: false, default: 0
      t.boolean :active, null: false, default: true
      t.boolean :delinquent, null: false, default: false

      t.timestamps
    end

    add_index :users, %i[condominium_id email], unique: true
  end
end

