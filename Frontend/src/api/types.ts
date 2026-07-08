export type Role = 'administrator' | 'owner' | 'proxy' | 'guest'
export type MeetingType = 'administrators_only' | 'with_owners' | 'with_guests'
export type MeetingStatus = 'scheduled' | 'in_progress' | 'canceled' | 'finished'
export type ResponseType = 'yes_no_abstain' | 'multiple_choice' | 'name_election'
export type Visibility = 'open_vote' | 'secret_vote'
export type VoteStatus = 'waiting' | 'active' | 'closed'

export interface Condominium {
  id: number
  name: string
  address: string | null
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: number
  condominium_id: number
  title: string
  starts_at: string
  meeting_type: MeetingType
  status: MeetingStatus
  finished_at: string | null
  created_at: string
  updated_at: string
  agenda_items?: AgendaItem[]
  votes?: Vote[]
}

export interface User {
  id: number
  condominium_id: number
  proxy_for_id: number | null
  meeting_id: number | null
  name: string
  email: string
  role: Role
  lots_count: number
  houses_count: number
  vote_weight: string
  active: boolean
  delinquent: boolean
  initial_password?: string
  access_token?: string
}

export interface AgendaItem {
  id: number
  meeting_id: number
  title: string
  description: string | null
  attachment_url: string | null
  attachment_filename?: string
  attachment_content_type?: string
  attachment_byte_size?: number
  position: number
  created_at: string
  updated_at: string
}

export interface VoteOption {
  id: number
  vote_id: number
  description: string
  position: number
  created_at: string
  updated_at: string
}

export interface Vote {
  id: number
  meeting_id: number
  agenda_item_id: number
  statement: string
  response_type: ResponseType
  visibility: Visibility
  status: VoteStatus
  duration_minutes: number
  started_at: string | null
  closes_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  agenda_item?: AgendaItem
  vote_options?: VoteOption[]
}

export interface Ballot {
  id: number
  vote_id: number
  vote_option_id: number
  user_id: number
  weight: number
  cast_at: string
}

export interface VoteResultSummary {
  option_id: number
  description: string
  ballots_count: number
  weight_total: number
  weight_percentage: number
}

export interface VoteResultBallot {
  id: number
  user: { id: number; name: string; email: string }
  option: string
  weight: number
  cast_at: string
}

export interface VoteResult {
  vote: Vote
  summary: VoteResultSummary[]
  ballots: VoteResultBallot[]
}

export interface MeetingUser {
  id: number
  meeting_id: number
  user_id: number
  joined_at: string
  left_at: string | null
  user: { id: number; name: string; email: string }
}
