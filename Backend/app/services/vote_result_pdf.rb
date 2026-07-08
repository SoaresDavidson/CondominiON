class VoteResultPdf
  def initialize(vote)
    @vote = vote
  end

  def render
    Prawn::Document.new do |pdf|
      pdf.text "Resultado da Votacao", size: 20, style: :bold
      pdf.move_down 8
      pdf.text @vote.statement
      pdf.text "Reuniao: #{@vote.meeting.title}"
      pdf.text "Pauta: #{@vote.agenda_item.title}"
      pdf.text "Status: #{@vote.status}"
      pdf.move_down 16

      pdf.table(summary_rows, header: true, width: pdf.bounds.width)

      if @vote.open_vote?
        pdf.move_down 18
        pdf.text "Historico nominal", style: :bold
        pdf.move_down 8
        pdf.table(ballot_rows, header: true, width: pdf.bounds.width)
      end
    end.render
  end

  private

  def summary_rows
    [["Opcao", "Qtd. votos", "Peso total", "% Peso"]] +
      @vote.result.map do |item|
        [
          item[:description],
          item[:ballots_count],
          format("%.2f", item[:weight_total]),
          "#{format('%.2f', item[:weight_percentage])}%"
        ]
      end
  end

  def ballot_rows
    [["Participante", "E-mail", "Voto", "Peso", "Horario"]] +
      @vote.ballots.includes(:user, :vote_option).order(:cast_at).map do |ballot|
        [
          ballot.user.name,
          ballot.user.email,
          ballot.vote_option.description,
          format("%.2f", ballot.weight.to_f),
          I18n.l(ballot.cast_at, format: :long)
        ]
      end
  end
end
