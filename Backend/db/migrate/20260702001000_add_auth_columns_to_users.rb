class AddAuthColumnsToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :password_digest, :string
    add_column :users, :access_token, :string
    add_column :users, :active_session_token, :string
    add_column :users, :reset_password_token, :string
    add_column :users, :reset_password_sent_at, :datetime

    add_index :users, :access_token, unique: true
    add_index :users, :reset_password_token, unique: true
  end
end
