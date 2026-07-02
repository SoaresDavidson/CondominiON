import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  Download,
  FilePlus2,
  Filter,
  KeyRound,
  Mail,
  Play,
  Search,
  Send,
  ShieldCheck,
  Users,
  Vote,
} from 'lucide-react'
import { useMemo, useState } from 'react'

type Page =
  | 'condominios'
  | 'reunioes'
  | 'agendar'
  | 'detalhes'
  | 'convites'
  | 'usuarios'
  | 'usuario'
  | 'procurador'
  | 'senha'
  | 'votacoes'
  | 'votacao'
  | 'voto'
  | 'resultado'

const meetings = [
  {
    title: 'Discussao sobre Higiene Canina',
    date: '21/06/2026 - 15:30 BRT',
    type: 'Com Proprietarios',
    status: 'Agendada',
  },
  {
    title: 'Deliberacao sobre Reforma da Area de Lazer',
    date: '19/06/2026 - 15:00 BRT',
    type: 'Com Convidados',
    status: 'Em Andamento',
  },
  {
    title: 'Aprovacao da Previsao Orcamentaria Anual',
    date: '15/06/2026 - 14:00 BRT',
    type: 'Com Proprietarios',
    status: 'Cancelada',
  },
  {
    title: 'Preenchimento de Vaga no Conselho Administrador',
    date: '14/06/2026 - 09:00 BRT',
    type: 'Somente Administradores',
    status: 'Finalizada',
  },
]

const users = [
  ['Jose Roberto Reis', 'jrs@gmail.com', 'Administrador'],
  ['Amanda Oliveira', 'aoliveira@uol.com.br', 'Procurador'],
  ['Diego Maradona', 'dmaradona10@gmail.com', 'Proprietario'],
  ['Edson Arantes do Nascimento', 'omaior@gmail.com', 'Convidado'],
]

const votes = [
  ['AGO - Mai/2026', 'Aprovacao de Orcamento', 'Sim/Nao/Abs.', 'Aberta', 'Aguardando'],
  ['AGO - Mai/2026', 'Eleicao do Sindico', 'Eleicao de Nomes', 'Fechada', 'Encerrada'],
]

const navItems: Array<[Page, string, typeof Building2]> = [
  ['condominios', 'Condominios', Building2],
  ['reunioes', 'Reunioes', CalendarDays],
  ['usuarios', 'Usuarios', Users],
  ['votacoes', 'Votacoes', Vote],
  ['resultado', 'Resultados', ShieldCheck],
]

function App() {
  const [page, setPage] = useState<Page>('condominios')
  const [selectedVote, setSelectedVote] = useState('Sim')
  const voteWeight = useMemo(() => (4 * 2 + 1).toLocaleString('pt-BR'), [])

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-emerald-600 text-white">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">CondominiON</p>
              <p className="text-sm text-slate-500">Assembleias e votacoes</p>
            </div>
          </div>

          <nav className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {navItems.map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPage(id)}
                className={`flex h-11 items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition ${
                  page === id
                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Condominio ativo</p>
            <p className="mt-1 text-sm text-slate-600">Residencial Jardim das Palmeiras</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Perfil administrador
            </p>
          </div>
        </aside>

        <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          {page === 'condominios' && <Condominios onNavigate={setPage} />}
          {page === 'reunioes' && <Reunioes onNavigate={setPage} />}
          {page === 'agendar' && <Agendar onNavigate={setPage} />}
          {page === 'detalhes' && <Detalhes onNavigate={setPage} />}
          {page === 'convites' && <Convites onNavigate={setPage} />}
          {page === 'usuarios' && <Usuarios onNavigate={setPage} />}
          {page === 'usuario' && <UsuarioForm voteWeight={voteWeight} onNavigate={setPage} />}
          {page === 'procurador' && <Procurador onNavigate={setPage} />}
          {page === 'senha' && <Senha onNavigate={setPage} />}
          {page === 'votacoes' && <Votacoes onNavigate={setPage} />}
          {page === 'votacao' && <VotacaoForm onNavigate={setPage} />}
          {page === 'voto' && (
            <Voto selectedVote={selectedVote} setSelectedVote={setSelectedVote} onNavigate={setPage} />
          )}
          {page === 'resultado' && <Resultado />}
        </section>
      </div>
    </main>
  )
}

function PageHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <header className="mb-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
    </header>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>
}

function Button({
  children,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const styles = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
    />
  )
}

function Select({ children }: { children: React.ReactNode }) {
  return (
    <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
      {children}
    </select>
  )
}

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === 'Agendada' || value === 'Aguardando'
      ? 'bg-sky-50 text-sky-700 ring-sky-200'
      : value === 'Em Andamento' || value === 'Ativa'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : value === 'Cancelada'
          ? 'bg-rose-50 text-rose-700 ring-rose-200'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-200'

  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${tone}`}>{value}</span>
}

function Condominios({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Selecao de ambiente" title="Escolha o condominio" />
      <div className="grid gap-4 md:grid-cols-2">
        {['Condominio Belas Flores', 'Condominio Canto Dourado'].map((name) => (
          <Card key={name}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{name}</h2>
                <p className="mt-1 text-sm text-slate-600">Ambiente isolado com reunioes, usuarios e pautas proprias.</p>
              </div>
              <Button onClick={() => onNavigate('reunioes')}>
                Acessar <ChevronRight size={17} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}

function Reunioes({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Gestao de reunioes" title="Reunioes do condominio" />
      <Card>
        <div className="grid gap-3 lg:grid-cols-4">
          <Field label="Titulo"><Input placeholder="Lei do silencio" /></Field>
          <Field label="Periodo"><Input type="date" defaultValue="2026-06-21" /></Field>
          <Field label="Tipo"><Select><option>Com Proprietarios</option><option>Com Convidados</option></Select></Field>
          <Field label="Status"><Select><option>Agendada</option><option>Em Andamento</option><option>Finalizada</option></Select></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary"><Filter size={17} /> Limpar</Button>
          <Button><Search size={17} /> Pesquisar</Button>
          <Button onClick={() => onNavigate('agendar')}><FilePlus2 size={17} /> Agendar</Button>
        </div>
      </Card>
      <Card className="mt-4 overflow-hidden p-0">
        <Table
          headers={['Titulo', 'Data', 'Tipo', 'Status', 'Acoes']}
          rows={meetings.map((meeting) => [
            meeting.title,
            meeting.date,
            meeting.type,
            <StatusBadge value={meeting.status} />,
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => onNavigate('detalhes')}>Detalhes</Button>
              {meeting.status === 'Agendada' && <Button><Play size={16} /> Iniciar</Button>}
              {meeting.status === 'Agendada' && <Button variant="secondary" onClick={() => onNavigate('procurador')}>Procurador</Button>}
              {meeting.status === 'Em Andamento' && <Button onClick={() => onNavigate('voto')}>Entrar</Button>}
              {meeting.status === 'Em Andamento' && <Button variant="secondary" onClick={() => onNavigate('convites')}><Send size={16} /> Convites</Button>}
            </div>,
          ])}
        />
      </Card>
    </>
  )
}

function Agendar({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Nova reuniao" title="Agendamento de reuniao" />
      <Card className="max-w-3xl">
        <div className="grid gap-4">
          <Field label="Titulo"><Input defaultValue="Discussao acerca da Lei do Silencio em Feriados e Finais de Semana" /></Field>
          <Field label="Data e hora"><Input type="datetime-local" defaultValue="2026-06-21T16:02" /></Field>
          <Field label="Tipo"><Select><option>Somente Administradores</option><option>Com Proprietarios</option><option>Com Convidados</option></Select></Field>
        </div>
        <div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => onNavigate('reunioes')}>Voltar</Button><Button onClick={() => onNavigate('reunioes')}><Check size={17} /> Confirmar</Button></div>
      </Card>
    </>
  )
}

function Detalhes({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Relatorios" title="Detalhes da reuniao" />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Titulo', 'Discussao acerca da Lei do Silencio'],
              ['Data/Horario', '16:00 domingo, 21 de junho de 2026'],
              ['Tipo', 'Com Convidados'],
              ['Total de entradas', '76'],
              ['Votacoes totais', '2'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md bg-slate-50 p-3">
                <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
                <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Gerar Ata', 'Baixar Gravacao', 'Baixar Chat', 'Gerar Log', 'Gerar Transcricao'].map((label) => (
              <Button key={label} variant="secondary"><Download size={16} /> {label}</Button>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="font-bold text-slate-950">Votacoes da reuniao</h2>
          <div className="mt-3 grid gap-3">
            {['Eleicao Sindical', 'Regra do Silencio Aliviada aos Sabados'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                <div><p className="font-semibold text-slate-900">{item}</p><p className="text-sm text-slate-500">{index === 0 ? 75 : 66} votantes</p></div>
                <Button variant="secondary" onClick={() => onNavigate('resultado')}>Visualizar</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-0">
        <Table headers={['Nome', 'E-mail', 'Cargo']} rows={[
          ['Joao Anacleto', 'canalaroda@gmail.com', 'Administrador'],
          ['Lamine Yamal', 'messiesmejor@gmail.com', 'Proprietario'],
          ['Erling Haaland', 'viking@gmail.com', 'Convidado'],
        ]} />
      </Card>
    </>
  )
}

function Convites({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Convites" title="Disparo em massa" />
      <Card className="max-w-3xl">
        <div className="grid gap-4">
          <Field label="Reuniao"><Input readOnly value="Discussao acerca da Lei do Silencio" /></Field>
          <Field label="Arquivo da planilha"><Input type="file" accept=".csv,.xlsx" /></Field>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            Colunas obrigatorias: <strong>Nome, E-Mail, Unidades, Peso Total</strong>
          </div>
        </div>
        <div className="mt-5 flex gap-2"><Button onClick={() => onNavigate('reunioes')}><Mail size={17} /> Validar e disparar</Button><Button variant="secondary" onClick={() => onNavigate('reunioes')}>Cancelar</Button></div>
      </Card>
    </>
  )
}

function Usuarios({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Gestao de usuarios" title="Usuarios cadastrados" />
      <Card>
        <div className="grid gap-3 lg:grid-cols-3">
          <Field label="Nome"><Input placeholder="Jose Roberto Reis" /></Field>
          <Field label="E-mail"><Input placeholder="jrs@gmail.com" /></Field>
          <Field label="Tipo"><Select><option>Administrador</option><option>Proprietario</option><option>Convidado</option><option>Procurador</option></Select></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><Button><Search size={17} /> Pesquisar</Button><Button onClick={() => onNavigate('usuario')}><FilePlus2 size={17} /> Cadastrar usuario</Button><Button variant="secondary" onClick={() => onNavigate('senha')}><KeyRound size={17} /> Recuperar senha</Button></div>
      </Card>
      <Card className="mt-4 p-0">
        <Table headers={['Nome', 'E-mail', 'Tipo', 'Acoes']} rows={users.map((user) => [...user, <Button variant="secondary" onClick={() => onNavigate('usuario')}>Visualizar</Button>])} />
      </Card>
    </>
  )
}

function UsuarioForm({ voteWeight, onNavigate }: { voteWeight: string; onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Cadastro" title="Cadastro e edicao de usuario" />
      <Card className="max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome"><Input defaultValue="Jose Roberto Reis" /></Field>
          <Field label="E-mail"><Input defaultValue="jrs@gmail.com" /></Field>
          <Field label="Tipo"><Select><option>Proprietario</option><option>Administrador</option><option>Convidado</option><option>Procurador</option></Select></Field>
          <Field label="Status"><Select><option>Ativo</option><option>Inativo</option></Select></Field>
          <Field label="Terrenos"><Input type="number" defaultValue={4} /></Field>
          <Field label="Casas"><Input type="number" defaultValue={1} /></Field>
          <Field label="Peso total"><Input readOnly value={voteWeight} /></Field>
          <Field label="Inadimplente"><Select><option>Nao</option><option>Sim</option></Select></Field>
          <Field label="Procurador de"><Select><option>Selecione um proprietario</option><option>Maria Oliveira</option></Select></Field>
          <Field label="Reuniao"><Select><option>Discussao sobre Higiene Canina</option><option>AGO - Mai/2026</option></Select></Field>
        </div>
        <div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => onNavigate('usuarios')}>Cancelar</Button><Button onClick={() => onNavigate('usuarios')}><Check size={17} /> Salvar</Button></div>
      </Card>
    </>
  )
}

function Procurador({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Representacao" title="Cadastro de procurador" />
      <Card className="max-w-3xl">
        <div className="grid gap-4">
          <Field label="Reuniao selecionada"><Input readOnly value="Discussao sobre Higiene Canina" /></Field>
          <Field label="Nome"><Input defaultValue="Alexandre Ribas" /></Field>
          <Field label="E-mail"><Input defaultValue="alexribas@gmail.com" /></Field>
        </div>
        <div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => onNavigate('reunioes')}>Cancelar</Button><Button onClick={() => onNavigate('reunioes')}><Check size={17} /> Cadastrar procurador</Button></div>
      </Card>
    </>
  )
}

function Senha({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Acesso" title="Recuperacao de senha" />
      <Card className="max-w-xl">
        <Field label="E-mail cadastrado"><Input type="email" defaultValue="joaosilva@gmail.com" /></Field>
        <div className="mt-5 flex gap-2"><Button><Mail size={17} /> Enviar link</Button><Button variant="secondary" onClick={() => onNavigate('usuarios')}>Voltar ao login</Button></div>
      </Card>
    </>
  )
}

function Votacoes({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Gestao de votacoes" title="Votacoes cadastradas" />
      <Card>
        <div className="grid gap-3 lg:grid-cols-5">
          <Field label="Reuniao"><Select><option>AGO - Mai/2026</option></Select></Field>
          <Field label="Pauta"><Select><option>Aprovacao de Orcamento</option></Select></Field>
          <Field label="Tipo"><Select><option>Sim/Nao/Abstencao</option><option>Eleicao de Nomes</option></Select></Field>
          <Field label="Visibilidade"><Select><option>Aberta</option><option>Fechada</option></Select></Field>
          <Field label="Status"><Select><option>Aguardando</option><option>Ativa</option><option>Encerrada</option></Select></Field>
        </div>
        <div className="mt-4 flex gap-2"><Button><Search size={17} /> Pesquisar</Button><Button onClick={() => onNavigate('votacao')}><FilePlus2 size={17} /> Nova votacao</Button></div>
      </Card>
      <Card className="mt-4 p-0">
        <Table headers={['Reuniao', 'Pauta / Enunciado', 'Tipo', 'Visib.', 'Status', 'Comandos']} rows={votes.map((vote) => [...vote.slice(0, 4), <StatusBadge value={vote[4]} />, <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => onNavigate('votacao')}>Visualizar</Button><Button onClick={() => onNavigate('voto')}>Iniciar</Button><Button variant="secondary" onClick={() => onNavigate('resultado')}>Resultado</Button></div>])} />
      </Card>
    </>
  )
}

function VotacaoForm({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <PageHeader eyebrow="Votacao" title="Edicao de votacao" />
      <Card>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Reuniao"><Input readOnly value="Assembleia Geral Ordinaria - Mai/2026" /></Field>
          <Field label="Pauta / Item"><Input readOnly value="Item 01 - Aprovacao do Orcamento Anual" /></Field>
          <Field label="Enunciado"><Input defaultValue="Voce aprova o orcamento proposto para o exercicio de 2026?" /></Field>
          <Field label="Tipo de resposta"><Select><option>Sim / Nao / Abstencao</option><option>Multipla Escolha</option><option>Eleicao de Nomes</option></Select></Field>
          <Field label="Visibilidade"><Select><option>Aberta</option><option>Fechada</option></Select></Field>
          <Field label="Duracao da votacao"><Input type="number" defaultValue={2} /></Field>
        </div>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-3">
          <div className="flex gap-2"><Input placeholder="Candidato Silva" /><Button variant="secondary">Adicionar opcao</Button></div>
          <Table headers={['Ordem', 'Descricao da opcao', 'Remover']} rows={[[1, 'Candidato Silva', <Button variant="danger">Remover</Button>], [2, 'Candidato Oliveira', <Button variant="danger">Remover</Button>]]} />
        </div>
        <div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => onNavigate('votacoes')}>Cancelar</Button><Button onClick={() => onNavigate('votacoes')}><Check size={17} /> Salvar</Button></div>
      </Card>
    </>
  )
}

function Voto({
  selectedVote,
  setSelectedVote,
  onNavigate,
}: {
  selectedVote: string
  setSelectedVote: (value: string) => void
  onNavigate: (page: Page) => void
}) {
  return (
    <>
      <PageHeader eyebrow="Votacao ativa" title="Realizacao de votacao" />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Reuniao', 'Assembleia Geral Ordinaria - Solar das Flores'],
              ['Pauta / Item', 'Item 01 - Aprovacao do Orcamento Anual'],
              ['Tipo', 'Sim / Nao / Abstencao'],
              ['Visibilidade', 'Aberta'],
              ['Unidade votante', 'Apt. 302 - Bloco B'],
              ['Peso do voto', '1,50'],
            ].map(([label, value]) => <div key={label} className="rounded-md bg-slate-50 p-3"><dt className="text-xs font-bold uppercase text-slate-500">{label}</dt><dd className="mt-1 font-semibold text-slate-950">{value}</dd></div>)}
          </dl>
          <p className="mt-5 text-lg font-bold text-slate-950">Voce aprova o orcamento proposto para o exercicio de 2026?</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['Sim', 'Nao', 'Abstencao'].map((option) => (
              <button key={option} type="button" onClick={() => setSelectedVote(option)} className={`h-14 rounded-md border text-base font-bold ${selectedVote === option ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-700'}`}>{option}</button>
            ))}
          </div>
          <div className="mt-5 flex gap-2"><Button onClick={() => onNavigate('resultado')}><Check size={17} /> Confirmar voto</Button></div>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase text-slate-500">Tempo restante</p>
          <p className="mt-2 text-5xl font-black text-emerald-700">01:45</p>
          <div className="mt-5 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
            Voto registrado com seguranca apos a confirmacao. Uma unidade nao pode votar duas vezes.
          </div>
        </Card>
      </div>
    </>
  )
}

function Resultado() {
  return (
    <>
      <PageHeader eyebrow="Apuracao" title="Resultado da votacao" />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Reuniao', 'AGO - Mai/2026'],
            ['Pauta', 'Aprovacao do Orcamento Anual'],
            ['Status', 'Encerrada'],
            ['Inicio / Encerramento', '10/05/2026 10:05 - 10:07'],
          ].map(([label, value]) => <div key={label} className="rounded-md bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-950">{value}</p></div>)}
        </div>
      </Card>
      <Card className="mt-4 p-0">
        <Table headers={['Opcao', 'Qtd. votos', 'Peso total', '% Peso', 'Resultado']} rows={[
          ['Sim', 18, '27,50', '73,33%', 'APROVADO'],
          ['Nao', 5, '7,50', '20,00%', '-'],
          ['Abstencao', 2, '2,50', '6,67%', '-'],
        ]} />
      </Card>
      <Card className="mt-4 p-0">
        <Table headers={['Unidade', 'Proprietario / Procurador', 'Voto', 'Peso', 'Horario do voto']} rows={[
          ['Apt. 101 - Bl. A', 'Joao da Silva', 'Sim', '1,50', '10/05/2026 10:05:42'],
          ['Apt. 203 - Bl. B', 'Maria Oliveira (proc. de Ana Santos)', 'Nao', '1,00', '10/05/2026 10:06:10'],
        ]} />
      </Card>
    </>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-3 font-bold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row, index) => (
            <tr key={index} className="bg-white align-middle">
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 font-medium text-slate-700">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
