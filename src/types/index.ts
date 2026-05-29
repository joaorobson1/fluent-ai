// ============================================================
// FLUENT AI — Tipos TypeScript Globais
// ============================================================

// ----- Enums -----

export type UserLevel = "zero" | "iniciante" | "intermediario" | "avancado";

export type TaskType =
  | "traducao"
  | "listening"
  | "complete_frase"
  | "multipla_escolha"
  | "montar_frase"
  | "pronuncia"
  | "conversa_ia"
  | "missao_dia"
  | "vocabulario";

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "pulada";

export type AchievementCategory = "streak" | "xp" | "tasks" | "vocabulary" | "special";

// ----- User / Profile -----

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
  level: UserLevel;
  xp_total: number;
  xp_level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at?: string;
  tasks_completed: number;
  vocabulary_learned: number;
  onboarding_completed: boolean;
  notifications_enabled: boolean;
  daily_goal: number;
  preferred_topics: string[];
  weak_areas: string[];
  timezone: string;
  created_at: string;
  updated_at: string;
}

// ----- Tasks -----

export interface Task {
  id: string;
  user_id: string;
  type: TaskType;
  title: string;
  description?: string;
  content: TaskContent;
  xp_reward: number;
  difficulty: number;
  topic?: string;
  is_daily: boolean;
  order_index: number;
  unlocked_at?: string;
  generated_at: string;
  expires_at?: string;
  created_at: string;
  progress?: TaskProgress;
}

// Conteúdo dinâmico por tipo de tarefa
export type TaskContent =
  | TranslationContent
  | ListeningContent
  | CompleteFraseContent
  | MultiplaEscolhaContent
  | MontarFraseContent
  | PronunciaContent
  | ConversaIAContent
  | MissaoDiaContent
  | VocabularioContent;

export interface TranslationContent {
  type: "traducao";
  text: string;
  direction: "pt_to_en" | "en_to_pt";
  hint?: string;
  accepted_answers: string[];
  explanation?: string;
}

export interface ListeningContent {
  type: "listening";
  audio_text: string;
  audio_url?: string;
  question: string;
  options: string[];
  correct_index: number;
  transcript?: string;
}

export interface CompleteFraseContent {
  type: "complete_frase";
  sentence_with_blank: string;
  blank_position: number;
  options: string[];
  correct_answer: string;
  full_sentence: string;
  explanation?: string;
}

export interface MultiplaEscolhaContent {
  type: "multipla_escolha";
  question: string;
  options: string[];
  correct_index: number;
  correct_answer: string; // texto exato da opção correta — fonte primária de verdade
  explanation?: string;
  image_url?: string;
}

export interface MontarFraseContent {
  type: "montar_frase";
  words: string[];
  correct_order: number[];
  translation: string;
  hint?: string;
}

export interface PronunciaContent {
  type: "pronuncia";
  text: string;
  phonetic: string;
  audio_url?: string;
  tips: string[];
  example_sentence: string;
}

export interface ConversaIAContent {
  type: "conversa_ia";
  scenario: string;
  system_prompt: string;
  starter_message: string;
  vocabulary_focus: string[];
  min_exchanges: number;
}

export interface MissaoDiaContent {
  type: "missao_dia";
  mission: string;
  steps: string[];
  badge_reward?: string;
  xp_bonus: number;
}

export interface VocabularioContent {
  type: "vocabulario";
  words: VocabularyItem[];
  quiz_mode: "flashcard" | "matching" | "spelling";
}

// ----- Task Progress -----

export interface TaskProgress {
  id: string;
  user_id: string;
  task_id: string;
  status: TaskStatus;
  attempts: number;
  score?: number;
  time_spent_seconds?: number;
  answer?: unknown;
  ai_feedback?: string;
  xp_earned: number;
  completed_at?: string;
  started_at?: string;
  created_at: string;
}

// ----- Vocabulary -----

export interface VocabularyItem {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  phonetic?: string;
  example_sentence?: string;
  example_translation?: string;
  audio_url?: string;
  image_url?: string;
  category?: string;
  difficulty: number;
  tags: string[];
  times_seen: number;
  times_correct: number;
  last_reviewed_at?: string;
  next_review_at?: string;
  mastery_level: number;
  ease_factor: number;
  interval_days: number;
  is_mastered: boolean;
  created_at: string;
  updated_at: string;
}

// ----- Gamification -----

export interface Achievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  xp_reward: number;
  requirement: Record<string, unknown>;
  is_hidden: boolean;
  created_at: string;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  seen: boolean;
  achievement?: Achievement;
}

export interface XPTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  task_id?: string;
  achievement_id?: string;
  created_at: string;
}

export interface StreakEntry {
  id: string;
  user_id: string;
  date: string;
  tasks_done: number;
  xp_earned: number;
  goal_met: boolean;
  created_at: string;
}

// ----- Notifications -----

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: "task" | "streak" | "achievement" | "general";
  data?: Record<string, unknown>;
  read: boolean;
  sent_at?: string;
  created_at: string;
}

// ----- AI -----

export interface AIMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  task_id?: string;
  tokens_used?: number;
  model: string;
  created_at: string;
}

export interface GenerateTasksRequest {
  userId: string;
  level: UserLevel;
  weakAreas: string[];
  completedTaskTypes: TaskType[];
  preferredTopics: string[];
  count?: number;
}

export interface GenerateTasksResponse {
  tasks: Omit<Task, "id" | "user_id" | "created_at">[];
  message?: string;
}

export interface ValidateAnswerRequest {
  taskId: string;
  userId: string;
  answer: unknown;
  taskType: TaskType;
  taskContent: TaskContent;
}

export interface ValidateAnswerResponse {
  correct: boolean;
  score: number;
  feedback: string;
  xp_earned: number;
  explanation?: string;
}

// ----- Dashboard -----

export interface DashboardStats {
  xp_total: number;
  xp_level: number;
  xp_next_level: number;
  xp_progress_percent: number;
  current_streak: number;
  longest_streak: number;
  tasks_today: number;
  tasks_goal: number;
  tasks_completed_total: number;
  vocabulary_learned: number;
  weekly_xp: number[];
  recent_achievements: Achievement[];
}

export interface WeeklyProgress {
  date: string;
  xp: number;
  tasks: number;
  goal_met: boolean;
}

// ----- Onboarding -----

export type OnboardingStep =
  | "welcome"
  | "level_choice"
  | "placement_test"
  | "topics"
  | "daily_goal"
  | "notifications"
  | "complete";

export interface PlacementTestQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  difficulty: UserLevel;
}

// ----- Forms -----

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  full_name: string;
  confirm_password: string;
}

// ----- API Responses -----

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
