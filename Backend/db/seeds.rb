condominium = Condominium.find_or_create_by!(name: "Residencial Jardim das Palmeiras") do |record|
  record.address = "Teresina - PI"
end

admin = condominium.users.find_or_create_by!(email: "joao.silva@email.com") do |user|
  user.name = "Joao Silva"
  user.role = :administrator
  user.password = "condominio123"
end

owner = condominium.users.find_or_create_by!(email: "maria.oliveira@email.com") do |user|
  user.name = "Maria Oliveira"
  user.role = :owner
  user.lots_count = 2
  user.houses_count = 1
  user.password = "condominio123"
end

meeting = condominium.meetings.find_or_create_by!(title: "Assembleia Geral Ordinaria - Mai/2026") do |record|
  record.starts_at = 1.day.from_now
  record.meeting_type = :with_owners
  record.status = :in_progress
end

meeting.meeting_users.find_or_create_by!(user: admin) { |presence| presence.joined_at = Time.current }
meeting.meeting_users.find_or_create_by!(user: owner) { |presence| presence.joined_at = Time.current }

agenda_item = meeting.agenda_items.find_or_create_by!(title: "Item 01 - Aprovacao do Orcamento Anual") do |record|
  record.description = "Votacao sobre a previsao orcamentaria do exercicio de 2026."
end

vote = meeting.votes.find_or_create_by!(agenda_item:, statement: "Voce aprova o orcamento proposto para o exercicio de 2026?") do |record|
  record.response_type = :yes_no_abstain
  record.visibility = :open_vote
  record.status = :active
  record.duration_minutes = 2
  record.started_at = Time.current
  record.closes_at = 2.minutes.from_now
end

%w[Sim Nao Abstencao].each_with_index do |description, index|
  vote.vote_options.find_or_create_by!(description:) do |option|
    option.position = index + 1
  end
end

