class AddAuditFieldsToBallots < ActiveRecord::Migration[7.2]
  def change
    add_column :ballots, :ip_address, :string
    add_column :ballots, :user_agent, :string
  end
end
