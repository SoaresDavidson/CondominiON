class VoteResultSpreadsheet
  def initialize(vote)
    @vote = vote
  end

  def render
    package = Axlsx::Package.new

    package.workbook.add_worksheet(name: "Resumo") do |sheet|
      sheet.add_row ["Opcao", "Qtd. votos", "Peso total", "% Peso"]
      @vote.result.each do |item|
        sheet.add_row [item[:description], item[:ballots_count], item[:weight_total], item[:weight_percentage]]
      end
    end

    if @vote.open_vote?
      package.workbook.add_worksheet(name: "Votos") do |sheet|
        sheet.add_row ["Participante", "E-mail", "Voto", "Peso", "Horario"]
        @vote.ballots.includes(:user, :vote_option).order(:cast_at).each do |ballot|
          sheet.add_row [
            ballot.user.name,
            ballot.user.email,
            ballot.vote_option.description,
            ballot.weight.to_f,
            ballot.cast_at.iso8601
          ]
        end
      end
    end

    package.to_stream.read
  end
end
