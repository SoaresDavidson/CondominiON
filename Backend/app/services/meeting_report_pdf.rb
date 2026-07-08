class MeetingReportPdf
  def initialize(meeting)
    @meeting = meeting
  end

  def render
    Prawn::Document.new do |pdf|
      pdf.text "Relatorio Gerencial Consolidado", size: 20, style: :bold
      pdf.move_down 8
      pdf.text "Reuniao: #{@meeting.title}"
      pdf.text "Status: #{@meeting.status}"
      pdf.text "Finalizada em: #{I18n.l(@meeting.finished_at, format: :long)}" if @meeting.finished_at.present?
      pdf.move_down 16

      pdf.text "Presenca", style: :bold
      pdf.move_down 8
      pdf.table(presence_rows, header: true, width: pdf.bounds.width)
      pdf.move_down 18

      pdf.text "Deliberacoes por pauta", style: :bold
      pdf.move_down 8
      deliberation_rows.each do |row|
        pdf.table(row, header: true, width: pdf.bounds.width)
        pdf.move_down 12
      end
    end.render
  end

  private

  def presence_rows
    owners = @meeting.condominium.users.owner
    present_users = User.where(id: @meeting.meeting_users.select(:user_id))
    represented_owners = present_users.proxy.where.not(proxy_for_id: nil).count
    total_weight = owners.sum(:vote_weight).to_f
    present_weight = present_users.sum(:vote_weight).to_f
    quorum = total_weight.positive? ? ((present_weight / total_weight) * 100).round(2) : 0

    [
      ["Metrica", "Valor"],
      ["Unidades/proprietarios cadastrados", owners.count],
      ["Participantes presentes", present_users.count],
      ["Presentes por procuracao", represented_owners],
      ["Peso total cadastrado", format("%.2f", total_weight)],
      ["Peso presente", format("%.2f", present_weight)],
      ["Quorum por peso", "#{format('%.2f', quorum)}%"]
    ]
  end

  def deliberation_rows
    @meeting.agenda_items.order(:position).map do |agenda_item|
      vote = @meeting.votes.find_by(agenda_item:)
      rows = [["Pauta #{agenda_item.position}: #{agenda_item.title}", "Valor"]]

      if vote.blank?
        rows << ["Votacao", "Nao cadastrada"]
        next rows
      end

      summary = vote.result
      winner = summary.max_by { |item| item[:weight_total] }
      total_ballots = summary.sum { |item| item[:ballots_count] }

      rows << ["Votacao", vote.statement]
      rows << ["Total de votos", total_ballots]
      rows << ["Resultado vencedor", winner ? "#{winner[:description]} (#{format('%.2f', winner[:weight_percentage])}%)" : "-"]
      summary.each do |item|
        rows << [
          "Opcao: #{item[:description]}",
          "#{item[:ballots_count]} voto(s), peso #{format('%.2f', item[:weight_total])}, #{format('%.2f', item[:weight_percentage])}%"
        ]
      end

      rows
    end
  end
end
