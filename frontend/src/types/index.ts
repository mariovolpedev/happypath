// ─── Auth ────────────────────────────────────────────────────────────────────
export type Role = 'USER' | 'MODERATOR' | 'ADMIN'

export interface AuthUser {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  role: Role
  verified: boolean
}

// ─── Users ───────────────────────────────────────────────────────────────────
export interface UserSummary {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  role: Role
  verified: boolean
}

export interface UserProfile extends UserSummary {
  bio?: string
  profileColor?: string
  followerCount: number
  followingCount: number
  isFollowed: boolean
  isBlocked: boolean
  createdAt: string
}

// ─── Contents ────────────────────────────────────────────────────────────────
export interface ContentResponse {
  id: number
  title: string
  body?: string
  mediaUrl?: string
  mediaType?: 'IMAGE' | 'VIDEO'
  author: UserSummary
  themeName?: string
  themeEmoji?: string
  themeId?: number
  reactionCount: number
  commentCount: number
  createdAt: string
  myReaction?: string
}

// ─── Messages ────────────────────────────────────────────────────────────────
export interface MessageResponse {
  id: number
  sender: UserSummary
  senderAlterEgo?: AlterEgoResponse
  recipient: UserSummary
  text?: string
  readByRecipient: boolean
  sentAt: string
  attachedContent?: {
    id: number
    title: string
    body?: string
    mediaUrl?: string
    author: UserSummary
    themeName?: string
    themeEmoji?: string
  }
  attachedUser?: UserSummary
  /** URL MinIO di un'immagine allegata al messaggio */
  imageUrl?: string
}

// ─── Alter Egos ──────────────────────────────────────────────────────────────
export interface AlterEgoResponse {
  id: number
  name: string
  bio?: string
  avatarUrl?: string
  verified: boolean
  createdAt: string
}

// ─── Pages ───────────────────────────────────────────────────────────────────
export interface Page<T> {
  content: T[]
  totalPages: number
  totalElements: number
  number: number
  size: number
  last: boolean
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
export type ReportTarget = 'USER' | 'CONTENT' | 'COMMENT'
