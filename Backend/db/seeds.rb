# Popula o banco com dados que cobrem todos os fluxos do CondominiOn: multiplos
# condominios, todos os papeis de usuario, todos os tipos/status de reuniao,
# todos os tipos/visibilidades de votacao, anexo de PDF, presenca/log de acesso
# e votos com pesos diferentes. Idempotente: pode ser rodado varias vezes
# (usa find_or_create_by!).
#
#   docker compose run --rm backend bin/rails db:seed

require "stringio"

PASSWORD = "condominio123".freeze

def demo_vote_with_ballots(meeting, agenda_item, statement:, response_type:, visibility:, options:, ballots:, close: true)
  vote = meeting.votes.find_or_create_by!(agenda_item:, statement:) do |record|
    record.response_type = response_type
    record.visibility = visibility
    record.duration_minutes = 5
    record.status = :active
    record.started_at = 10.minutes.ago
    record.closes_at = close ? 5.minutes.ago : 30.minutes.from_now
  end

  vote_options = options.each_with_index.map do |description, index|
    vote.vote_options.find_or_create_by!(description:) { |o| o.position = index + 1 }
  end

  if vote.active? || vote.waiting?
    ballots.each do |user, option_index|
      meeting.meeting_users.find_or_create_by!(user:) { |p| p.joined_at = 20.minutes.ago }

      vote.ballots.find_or_create_by!(user:) do |ballot|
        ballot.vote_option = vote_options[option_index]
        ballot.cast_at = 8.minutes.ago
        ballot.ip_address = "127.0.0.1"
        ballot.user_agent = "Mozilla/5.0 (Seed Demo)"
      end
    end

    vote.update!(status: :closed, closed_at: 4.minutes.ago) if close
  end

  vote
end

def attach_demo_pdf(agenda_item, filename: "edital-convocacao.pdf")
  return if agenda_item.attachment.attached?

  pdf_content = <<~PDF
    %PDF-1.4
    1 0 obj
    << /Type /Catalog /Pages 2 0 R >>
    endobj
    2 0 obj
    << /Type /Pages /Kids [3 0 R] /Count 1 >>
    endobj
    3 0 obj
    << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>
    endobj
    trailer
    << /Root 1 0 R >>
    %%EOF
  PDF

  agenda_item.attachment.attach(
    io: StringIO.new(pdf_content),
    filename:,
    content_type: "application/pdf"
  )
end

def register_presence(meeting, user, joined_ago:, left_ago: nil)
  presence = meeting.meeting_users.find_or_create_by!(user:) { |p| p.joined_at = joined_ago.ago }
  meeting.access_logs.find_or_create_by!(user:, event: :join) do |log|
    log.occurred_at = joined_ago.ago
    log.ip_address = "200.150.10.#{user.id}"
    log.user_agent = "Mozilla/5.0 (Seed Demo)"
  end

  return unless left_ago

  presence.update!(left_at: left_ago.ago)
  meeting.access_logs.find_or_create_by!(user:, event: :leave) do |log|
    log.occurred_at = left_ago.ago
    log.ip_address = "200.150.10.#{user.id}"
    log.user_agent = "Mozilla/5.0 (Seed Demo)"
  end
end

# ---------------------------------------------------------------------------
# Condominio principal (dados ricos, usado para demonstrar todas as telas)
# ---------------------------------------------------------------------------

condominium = Condominium.find_or_create_by!(name: "Residencial Jardim das Palmeiras") do |record|
  record.address = "Teresina - PI"
end

admin = condominium.users.find_or_create_by!(email: "joao.silva@email.com") do |user|
  user.name = "Joao Silva"
  user.role = :administrator
  user.password = PASSWORD
end

owner1 = condominium.users.find_or_create_by!(email: "maria.oliveira@email.com") do |user|
  user.name = "Maria Oliveira"
  user.role = :owner
  user.lots_count = 2
  user.houses_count = 1
  user.password = PASSWORD
end

owner2 = condominium.users.find_or_create_by!(email: "carlos.souza@email.com") do |user|
  user.name = "Carlos Souza"
  user.role = :owner
  user.lots_count = 3
  user.houses_count = 0
  user.password = PASSWORD
end

owner_delinquent = condominium.users.find_or_create_by!(email: "roberto.lima@email.com") do |user|
  user.name = "Roberto Lima"
  user.role = :owner
  user.lots_count = 1
  user.houses_count = 1
  user.delinquent = true
  user.password = PASSWORD
end

# --- Reuniao "com convidados" (unica que aceita Convidado/Procurador) ---

guest_meeting = condominium.meetings.find_or_create_by!(title: "Reuniao Aberta - Apresentacao da Reforma da Fachada") do |record|
  record.starts_at = 15.minutes.from_now
  record.meeting_type = :with_guests
  record.status = :in_progress
end

guest = condominium.users.find_or_create_by!(email: "convidado.demo@email.com") do |user|
  user.name = "Erling Haaland"
  user.role = :guest
  user.meeting = guest_meeting
end

proxy = condominium.users.find_or_create_by!(email: "procurador.demo@email.com") do |user|
  user.name = "Alexandre Ribas"
  user.role = :proxy
  user.proxy_for = owner1
  user.meeting = guest_meeting
end

guest_agenda_item = guest_meeting.agenda_items.find_or_create_by!(title: "Apresentacao do Projeto de Reforma") do |record|
  record.description = "Apresentacao do orcamento e cronograma da reforma da fachada."
  record.position = 1
end

demo_vote_with_ballots(
  guest_meeting, guest_agenda_item,
  statement: "Voce aprova o inicio imediato da reforma da fachada?",
  response_type: :yes_no_abstain,
  visibility: :open_vote,
  options: %w[Sim Nao Abstencao],
  ballots: [],
  close: false
)

register_presence(guest_meeting, guest, joined_ago: 10.minutes)
register_presence(guest_meeting, proxy, joined_ago: 8.minutes)

# --- Reuniao agendada (para demonstrar o fluxo "Iniciar") ---

condominium.meetings.find_or_create_by!(title: "Assembleia Extraordinaria - Manutencao do Elevador") do |record|
  record.starts_at = 5.minutes.from_now
  record.meeting_type = :with_owners
  record.status = :scheduled
end

# --- Reuniao em andamento (votacao ativa + votacao aguardando + pauta sem votacao) ---

meeting_in_progress = condominium.meetings.find_or_create_by!(title: "Assembleia Geral Ordinaria - Mai/2026") do |record|
  record.starts_at = 1.day.from_now
  record.meeting_type = :with_owners
  record.status = :in_progress
end

register_presence(meeting_in_progress, admin, joined_ago: 30.minutes)
register_presence(meeting_in_progress, owner1, joined_ago: 25.minutes)
register_presence(meeting_in_progress, owner2, joined_ago: 20.minutes)

agenda_orcamento = meeting_in_progress.agenda_items.find_or_create_by!(title: "Item 01 - Aprovacao do Orcamento Anual") do |record|
  record.description = "Votacao sobre a previsao orcamentaria do exercicio de 2026."
  record.position = 1
end

demo_vote_with_ballots(
  meeting_in_progress, agenda_orcamento,
  statement: "Voce aprova o orcamento proposto para o exercicio de 2026?",
  response_type: :yes_no_abstain,
  visibility: :open_vote,
  options: %w[Sim Nao Abstencao],
  ballots: [[owner1, 0], [owner2, 0]],
  close: false
)

agenda_eleicao = meeting_in_progress.agenda_items.find_or_create_by!(title: "Item 02 - Eleicao do Sindico") do |record|
  record.description = "Eleicao do sindico para o proximo mandato (votacao secreta)."
  record.position = 2
end

vote_eleicao = meeting_in_progress.votes.find_or_create_by!(agenda_item: agenda_eleicao, statement: "Escolha o novo sindico") do |record|
  record.response_type = :name_election
  record.visibility = :secret_vote
  record.status = :waiting
  record.duration_minutes = 10
end
["Chapa 1 - Continuidade", "Chapa 2 - Renovacao"].each_with_index do |description, index|
  vote_eleicao.vote_options.find_or_create_by!(description:) { |o| o.position = index + 1 }
end

meeting_in_progress.agenda_items.find_or_create_by!(title: "Item 03 - Comunicados Gerais") do |record|
  record.description = "Avisos gerais da administracao, sem votacao vinculada."
  record.position = 3
end

# --- Reuniao finalizada (documentos: ata/log/relatorio/exportacoes) ---

meeting_finished = condominium.meetings.find_or_create_by!(title: "Assembleia Geral Ordinaria - Fev/2026") do |record|
  record.starts_at = 20.minutes.from_now
  record.meeting_type = :with_owners
  record.status = :in_progress
end

register_presence(meeting_finished, admin, joined_ago: 3.days, left_ago: 2.9.days)
register_presence(meeting_finished, owner1, joined_ago: 3.days, left_ago: 2.9.days)
register_presence(meeting_finished, owner2, joined_ago: 3.days, left_ago: 2.9.days)

agenda_edital = meeting_finished.agenda_items.find_or_create_by!(title: "Item 01 - Edital de Convocacao") do |record|
  record.description = "Edital de convocacao da assembleia, anexado em PDF."
  record.position = 1
end
attach_demo_pdf(agenda_edital)

demo_vote_with_ballots(
  meeting_finished, agenda_edital,
  statement: "Voce aprova a prestacao de contas do exercicio anterior?",
  response_type: :yes_no_abstain,
  visibility: :open_vote,
  options: %w[Sim Nao Abstencao],
  ballots: [[owner1, 0], [owner2, 1]]
)

agenda_conselho = meeting_finished.agenda_items.find_or_create_by!(title: "Item 02 - Eleicao de Membros do Conselho Fiscal") do |record|
  record.description = "Eleicao de tres membros para o conselho fiscal."
  record.position = 2
end

demo_vote_with_ballots(
  meeting_finished, agenda_conselho,
  statement: "Escolha um membro para o conselho fiscal",
  response_type: :multiple_choice,
  visibility: :open_vote,
  options: ["Candidato Silva", "Candidata Souza", "Candidato Pereira"],
  ballots: [[owner1, 0], [owner2, 0]]
)

meeting_finished.update!(status: :finished, finished_at: 2.9.days.ago)

# --- Reuniao cancelada ---

condominium.meetings.find_or_create_by!(title: "Assembleia Extraordinaria - Reforma da Piscina") do |record|
  record.starts_at = 10.minutes.from_now
  record.meeting_type = :with_owners
  record.status = :canceled
end

# --- Reuniao restrita a administradores ---

condominium.meetings.find_or_create_by!(title: "Reuniao Interna da Administracao") do |record|
  record.starts_at = 40.minutes.from_now
  record.meeting_type = :administrators_only
  record.status = :scheduled
end

# ---------------------------------------------------------------------------
# Segundo condominio (demonstra isolamento entre condominios)
# ---------------------------------------------------------------------------

condominium_b = Condominium.find_or_create_by!(name: "Edificio Bela Vista") do |record|
  record.address = "Teresina - PI"
end

admin_b = condominium_b.users.find_or_create_by!(email: "ana.pereira@email.com") do |user|
  user.name = "Ana Pereira"
  user.role = :administrator
  user.password = PASSWORD
end

owner_b = condominium_b.users.find_or_create_by!(email: "bruno.santos@email.com") do |user|
  user.name = "Bruno Santos"
  user.role = :owner
  user.lots_count = 1
  user.houses_count = 0
  user.password = PASSWORD
end

condominium_b.meetings.find_or_create_by!(title: "Assembleia Ordinaria - Bela Vista") do |record|
  record.starts_at = 1.hour.from_now
  record.meeting_type = :with_owners
  record.status = :scheduled
end

# ---------------------------------------------------------------------------
# Resumo para uso manual/demo
# ---------------------------------------------------------------------------

puts "\n== Seed concluido =="
puts "\n-- #{condominium.name} --"
puts "Administrador: #{admin.email} / #{PASSWORD}"
puts "Proprietario (adimplente): #{owner1.email} / #{PASSWORD}"
puts "Proprietario (adimplente): #{owner2.email} / #{PASSWORD}"
puts "Proprietario (inadimplente): #{owner_delinquent.email} / #{PASSWORD}"
puts "Convidado (acesso via token): #{guest.email} -> access_token=#{guest.access_token}"
puts "Procurador (acesso via token, representa #{owner1.name}): #{proxy.email} -> access_token=#{proxy.access_token}"
puts "  Link de acesso: http://localhost:5173/acesso/#{guest.access_token}"
puts "  Link de acesso: http://localhost:5173/acesso/#{proxy.access_token}"

puts "\n-- #{condominium_b.name} --"
puts "Administrador: #{admin_b.email} / #{PASSWORD}"
puts "Proprietario: #{owner_b.email} / #{PASSWORD}"

puts "\nReunioes criadas em #{condominium.name}:"
condominium.meetings.order(:created_at).each do |meeting|
  puts "  - #{meeting.title} (#{meeting.meeting_type}, #{meeting.status})"
end
puts
