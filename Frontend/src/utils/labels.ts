import type { MeetingStatus, MeetingType, Role, ResponseType, Visibility, VoteStatus } from '../api/types'

export const meetingTypeLabels: Record<MeetingType, string> = {
  administrators_only: 'Somente Administradores',
  with_owners: 'Com Proprietarios',
  with_guests: 'Com Convidados',
}

export const meetingStatusLabels: Record<MeetingStatus, string> = {
  scheduled: 'Agendada',
  in_progress: 'Em Andamento',
  canceled: 'Cancelada',
  finished: 'Finalizada',
}

export const roleLabels: Record<Role, string> = {
  administrator: 'Administrador',
  owner: 'Proprietario',
  proxy: 'Procurador',
  guest: 'Convidado',
}

export const responseTypeLabels: Record<ResponseType, string> = {
  yes_no_abstain: 'Sim / Nao / Abstencao',
  multiple_choice: 'Multipla Escolha',
  name_election: 'Eleicao de Nomes',
}

export const visibilityLabels: Record<Visibility, string> = {
  open_vote: 'Aberta',
  secret_vote: 'Fechada',
}

export const voteStatusLabels: Record<VoteStatus, string> = {
  waiting: 'Aguardando',
  active: 'Ativa',
  closed: 'Encerrada',
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
}
