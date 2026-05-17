export type UserRole = 'USER' | 'VERIFIED_USER' | 'MODERATOR' | 'ADMIN'
export type ContentStatus = 'ACTIVE' | 'CENSORED' | 'DELETED'
export type ReactionType = 'HEART' | 'LAUGH' | 'WOW' | 'CLAP' | 'SMILE'
export type BanDuration = 'SHORT' | 'MEDIUM' | 'LONG' | 'PERMANENT'
export type ReportTarget = 'USER' | 'CONTENT' | 'COMMENT'
export type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'
export type FeedSortStrategy = 'RECENT' | 'RANDOM' | 'SMART'
export type FeedItemType = 'CONTENT' | 'COMMENT' | 'REACTION' | 'FOLLOW_EVENT'

export type Role = UserRole

export interface UserSummary {
  id: number
  username: string
  displayName: string
  avatarUrl?: string
  role: UserRole
  verified: boolean
  tutorialCompleted: boolean
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
  preset: boolean
  followersCount: number
  followedByMe: boolean
  createdAt: string
}

export interface AlterEgoResponse {
  id: number
  name: string
  description?: string
  avatarUrl?: string
  owner: UserSummary
  createdAt: string
}

export interface ReactionEntry {
  userId: number
  type: ReactionType
  user: UserSummary
  alterEgo?: AlterEgoResponse
}

/** Singola reazione su un commento — risposta dell'API /reactions */
export interface CommentReactionEntry {
  id: number
  type: ReactionType
  user: UserSummary
  alterEgo?: AlterEgoResponse
  createdAt: string
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
  reactions?: ReactionEntry[]
  dedications: Array<{ from: UserSummary; to: UserSummary }>
  createdAt: string
  updatedAt: string
}

/** Riepilogo reazioni su un commento */
export interface CommentReactionSummary {
  total: number
  counts: Partial<Record<ReactionType, number>>
  myReaction?: ReactionType | null
}

export interface CommentResponse {
  id: number
  text: string
  author: UserSummary
  alterEgo?: AlterEgoResponse
  parentId?: number
  status: ContentStatus
  createdAt: string
  replyCount: number
  reactions: CommentReactionSummary | null
}

export interface FeedItemResponse {
  type: FeedItemType
  actor: UserSummary
  content?: ContentResponse
  comment?: CommentResponse
  reactionType?: string
  targetUser?: UserSummary
  eventAt: string
  score: number
}

export interface FeedSettings {
  sortStrategy: FeedSortStrategy
  showContents: boolean
  showComments: boolean
  showReactions: boolean
  showFollowEvents: boolean
}

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
  senderAlterEgo?: AlterEgoResponse
  recipient: UserSummary
  text: string
  readByRecipient: boolean
  sentAt: string
  attachedContent?: MessageContentSummary
  attachedUser?: UserSummary
  imageUrl?: string
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
