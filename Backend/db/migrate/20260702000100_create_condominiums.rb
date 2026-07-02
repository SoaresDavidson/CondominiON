class CreateCondominiums < ActiveRecord::Migration[7.2]
  def change
    create_table :condominiums do |t|
      t.string :name, null: false
      t.string :address

      t.timestamps
    end

    add_index :condominiums, :name, unique: true
  end
end

