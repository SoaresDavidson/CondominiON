class AccessLogHtmlRenderer
  EVENT_LABELS = {
    "join" => "Entrada na reuniao",
    "leave" => "Saida da reuniao"
  }.freeze

  def initialize(meeting)
    @meeting = meeting
  end

  def render
    logs = @meeting.access_logs.includes(:user).order(:occurred_at)

    <<~HTML
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>Log da Reuniao #{escape(@meeting.title)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
            h1 { font-size: 24px; margin-bottom: 4px; }
            p { color: #475569; }
            table { border-collapse: collapse; width: 100%; margin-top: 24px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Log da Reuniao</h1>
          <p>#{escape(@meeting.title)} - gerado em #{I18n.l(Time.current, format: :long)}</p>
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>E-mail</th>
                <th>IP</th>
                <th>Navegador/Dispositivo</th>
                <th>Data/Hora</th>
                <th>Evento</th>
              </tr>
            </thead>
            <tbody>
              #{logs.map { |log| row(log) }.join}
            </tbody>
          </table>
        </body>
      </html>
    HTML
  end

  private

  def row(log)
    <<~HTML
      <tr>
        <td>#{escape(log.user.name)}</td>
        <td>#{escape(log.user.email)}</td>
        <td>#{escape(log.ip_address)}</td>
        <td>#{escape(log.user_agent)}</td>
        <td>#{I18n.l(log.occurred_at, format: :long)}</td>
        <td>#{EVENT_LABELS.fetch(log.event)}</td>
      </tr>
    HTML
  end

  def escape(value)
    ERB::Util.html_escape(value.to_s)
  end
end
