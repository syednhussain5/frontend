// ── User & Auth ───────────────────────────────────────────────────────────────
export interface User {
  id: number
  username: string
  email: string
  role: 'student' | 'teacher' | 'admin'
  avatar?: string
  bio?: string
  xp: number
  level: number
  total_quizzes_taken: number
  total_correct_answers: number
  total_questions_answered: number
  current_streak: number
  longest_streak: number
  last_active_date?: string
  accuracy: number
  badges: UserBadge[]
  preferred_difficulty: 'easy' | 'medium' | 'hard'
  created_at: string
}

export interface Badge {
  id: number
  name: string
  description: string
  badge_type: string
  threshold: number
  icon: string
  xp_reward: number
  earned?: boolean
}

export interface UserBadge {
  badge: Badge
  earned_at: string
}

export interface Notification {
  id: number
  notif_type: string
  title: string
  message: string
  is_read: boolean
  data: Record<string, unknown>
  created_at: string
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive'
export type QuizStatus = 'generating' | 'ready' | 'failed'
export type QuestionType = 'mcq' | 'true_false' | 'multi_select'

export interface Option {
  id: string
  text: string
  order: number
  is_correct?: boolean
}

export interface Question {
  id: string
  text: string
  question_type: QuestionType
  difficulty: Difficulty
  image_url?: string
  options: Option[]
  explanation?: string
  topic_tag?: string
  order: number
}

export interface Quiz {
  id: string
  title: string
  topic: string
  description?: string
  difficulty: Difficulty
  question_count: number
  time_limit_minutes?: number
  status: QuizStatus
  is_public: boolean
  is_ai_generated: boolean
  allow_review: boolean
  randomize_questions: boolean
  randomize_options: boolean
  play_count: number
  average_score: number
  tags: string[]
  creator_username: string
  questions?: Question[]
  created_at: string
}

// ── Attempt ───────────────────────────────────────────────────────────────────
export type AttemptStatus = 'in_progress' | 'completed' | 'abandoned' | 'timed_out'

export interface Answer {
  id: string
  question: string
  question_text: string
  question_explanation: string
  selected_option_ids: string[]
  correct_options: Option[]
  is_correct: boolean
  time_taken_seconds: number
  shown_difficulty: string
}

export interface QuizAttempt {
  id: string
  quiz: string
  quiz_title: string
  quiz_topic?: string
  status: AttemptStatus
  score: number
  correct_count: number
  total_questions: number
  xp_earned: number
  time_taken_seconds?: number
  tab_switches?: number
  answers?: Answer[]
  started_at: string
  completed_at?: string
}

export interface AnswerResult {
  is_correct: boolean
  correct_option_ids: string[]
  explanation: string
}

export interface CompletionResult {
  attempt_id: string
  score: number
  correct_count: number
  total_questions: number
  time_taken_seconds: number
  tab_switches: number
  rewards: {
    xp_earned: number
    new_badges: { name: string; icon: string; description: string }[]
    level_up: boolean
    old_level?: number
    new_level?: number
    current_streak: number
  }
  weak_topics: string[]
}

// ── Multiplayer ───────────────────────────────────────────────────────────────
export interface RoomParticipant {
  user: number
  username: string
  avatar?: string
  xp: number
  score: number
  answers_given: number
  joined_at: string
}

export interface QuizRoom {
  id: string
  code: string
  quiz: string
  quiz_title: string
  host_username: string
  status: 'waiting' | 'in_progress' | 'finished'
  max_participants: number
  current_question_index: number
  participants: RoomParticipant[]
  participant_count: number
  created_at: string
  started_at?: string
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface Analytics {
  overview: {
    total_quizzes: number
    overall_accuracy: number
    average_score: number
    total_time_hours: number
    current_streak: number
    longest_streak: number
    xp: number
    level: number
    this_week_quizzes: number
    last_week_quizzes: number
    avg_time_per_question: number
  }
  weak_topics: { topic: string; accuracy: number; total: number }[]
  strong_topics: { topic: string; accuracy: number; total: number }[]
  daily_activity: { date: string; quizzes: number; xp: number; accuracy: number }[]
  score_history: { date: string; score: number; topic: string }[]
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  id: number
  username: string
  xp: number
  level: number
  total_quizzes_taken: number
  accuracy: number
  current_streak: number
  avatar?: string
}

// ── API Pagination ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}