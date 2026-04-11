export type UserRole = 'USER' | 'VERIFIED_USER' | 'MODERATOR' | 'ADMIN'
export type ContentStatus = 'ACTIVE' | 'CENSORED' | 'DELETED'
export type ReactionType = 'HEART' | 'LAUGH' | 'WOW' | 'CLAP' | 'SMILE'
export type BanDuration = 'SHORT' | 'MEDIUM' | 'LONG' | 'PERMANENT'
export type ReportTarget = 'USER' | 'CONTENT' | 'COMMENT'
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
export type AlterEgoVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface UserSummary {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  role: UserRole
  verified: boolean
}

export interface UserProfile extends UserSummary {
  bio?: string
  profileColor?: string
  followersCount: number
  followingCount: number
  isFollowedByMe: boolean
  isBlockedByMe: boolean
  createdAt: string
}

export interface ThemeResponse {
  id: number
  name: string
  description?: string
  iconEmoji?: string
}

export interface AlterEgoResponse {
  id: number
  name: string
  description?: string
  avatarUrl?: string
  owner: UserSummary
  verified: boolean   // ← aggiunto per feature verifica
}

export interface AlterEgoVerificationResponse {
  id: number
  alterEgo: AlterEgoResponse
  requester: UserSummary
  firstName: string
  lastName: string
  birthDate: string | null
  birthPlace: string
  codiceFiscale: string
  status: AlterEgoVerificationStatus
  reviewer?: UserSummary
  reviewNote?: string
  createdAt: string
  reviewedAt?: string
}

export interface ContentResponse {
  id: number
  title: string
  body?: string
  mediaUrl?: string
  author: UserSummary
  alterEgo?: AlterEgoResponse
  theme?: ThemeResponse
  status: ContentStatus
  reactionsCount: number
  commentsCount: number
  reactionsByType: Record<string, number>
  myReaction?: string
  dedications: Array<{ from: UserSummary; to: UserSummary }>
  createdAt: string
  updatedAt: string
}

export interface CommentResponse {
  id: number
  text: string
  author: UserSummary
  parentId?: number
  status: ContentStatus
  createdAt: string
}

/** Lightweight content summary embedded inside a message */
export interface MessageContentSummary {
  id: number
  title: string
  body?: string
  mediaUrl?: string
  author: UserSummary
  themeName?: string
  themeEmoji?: string
}

export interface MessageResponse {
  id: number
  sender: UserSummary
  recipient: UserSummary
  text: string
  readByRecipient: boolean
  sentAt: string
  attachedContent?: MessageContentSummary
  attachedUser?: UserSummary
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  last: boolean
}

export interface AuthResponse {
  token: string
  user: UserSummary
}
