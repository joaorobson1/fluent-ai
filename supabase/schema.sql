-- ============================================================
-- FLUENT AI — Schema Completo do Banco de Dados
-- ============================================================

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type user_level as enum ('zero', 'iniciante', 'intermediario', 'avancado');
create type task_type as enum (
  'traducao', 'listening', 'complete_frase', 'multipla_escolha',
  'montar_frase', 'pronuncia', 'conversa_ia', 'missao_dia', 'vocabulario'
);
create type task_status as enum ('pendente', 'em_andamento', 'concluida', 'pulada');
create type achievement_category as enum ('streak', 'xp', 'tasks', 'vocabulary', 'special');

-- ============================================================
-- TABELA: profiles (extensão do auth.users)
-- ============================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  username text unique,
  level user_level default 'iniciante',
  xp_total integer default 0,
  xp_level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_activity_at timestamptz,
  tasks_completed integer default 0,
  vocabulary_learned integer default 0,
  onboarding_completed boolean default false,
  notifications_enabled boolean default true,
  daily_goal integer default 5,
  preferred_topics text[] default '{}',
  weak_areas text[] default '{}',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- TABELA: tasks (banco de tarefas geradas)
-- ============================================================

create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type task_type not null,
  title text not null,
  description text,
  content jsonb not null,          -- estrutura dinâmica por tipo de tarefa
  xp_reward integer default 10,
  difficulty integer default 1,    -- 1-5
  topic text,                      -- grammar, vocabulary, pronunciation, etc
  is_daily boolean default false,
  order_index integer default 0,   -- ordem de desbloqueio
  unlocked_at timestamptz,
  generated_at timestamptz default now(),
  expires_at timestamptz,          -- tarefas expiram à meia-noite
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: task_progress (progresso por tarefa)
-- ============================================================

create table public.task_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  status task_status default 'pendente',
  attempts integer default 0,
  score integer,                   -- 0-100
  time_spent_seconds integer,
  answer jsonb,                    -- resposta do usuário
  ai_feedback text,
  xp_earned integer default 0,
  completed_at timestamptz,
  started_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, task_id)
);

-- ============================================================
-- TABELA: vocabulary (palavras salvas pelo usuário)
-- ============================================================

create table public.vocabulary (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word text not null,
  translation text not null,
  pronunciation text,
  phonetic text,
  example_sentence text,
  example_translation text,
  audio_url text,
  image_url text,
  category text,                   -- nouns, verbs, adjectives, etc.
  difficulty integer default 1,    -- 1-5
  tags text[] default '{}',
  times_seen integer default 0,
  times_correct integer default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,      -- spaced repetition
  mastery_level integer default 0, -- 0-5 (SM-2 algorithm)
  ease_factor numeric default 2.5,
  interval_days integer default 1,
  is_mastered boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, word)
);

-- ============================================================
-- TABELA: streaks (histórico de streaks)
-- ============================================================

create table public.streaks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  tasks_done integer default 0,
  xp_earned integer default 0,
  goal_met boolean default false,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- ============================================================
-- TABELA: achievements (conquistas disponíveis)
-- ============================================================

create table public.achievements (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  title text not null,
  description text not null,
  icon text not null,              -- emoji ou nome do ícone
  category achievement_category not null,
  xp_reward integer default 50,
  requirement jsonb not null,      -- ex: {"streak": 7} ou {"xp": 1000}
  is_hidden boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: user_achievements (conquistas desbloqueadas)
-- ============================================================

create table public.user_achievements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  unlocked_at timestamptz default now(),
  seen boolean default false,
  unique(user_id, achievement_id)
);

-- ============================================================
-- TABELA: ai_history (histórico de interações com IA)
-- ============================================================

create table public.ai_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id uuid default uuid_generate_v4(),
  role text not null,              -- 'user' | 'assistant'
  content text not null,
  task_id uuid references public.tasks(id),
  tokens_used integer,
  model text default 'gpt-4o-mini',
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: notifications (notificações do sistema)
-- ============================================================

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text default 'general',     -- 'task', 'streak', 'achievement', 'general'
  data jsonb,
  read boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: push_subscriptions (web push)
-- ============================================================

create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  p256dh text,
  auth text,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- ============================================================
-- TABELA: xp_transactions (histórico de XP)
-- ============================================================

create table public.xp_transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  task_id uuid references public.tasks(id),
  achievement_id uuid references public.achievements(id),
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES para performance
-- ============================================================

create index idx_tasks_user_daily on public.tasks(user_id, is_daily, expires_at);
create index idx_task_progress_user on public.task_progress(user_id, status);
create index idx_vocabulary_user_review on public.vocabulary(user_id, next_review_at);
create index idx_streaks_user_date on public.streaks(user_id, date desc);
create index idx_ai_history_user_session on public.ai_history(user_id, session_id);
create index idx_notifications_user_unread on public.notifications(user_id, read);
create index idx_xp_transactions_user on public.xp_transactions(user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_progress enable row level security;
alter table public.vocabulary enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.ai_history enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.xp_transactions enable row level security;

-- Policies: usuário acessa apenas seus próprios dados
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can manage own tasks" on public.tasks for all using (auth.uid() = user_id);

create policy "Users can manage own progress" on public.task_progress for all using (auth.uid() = user_id);
create policy "Users can manage own vocabulary" on public.vocabulary for all using (auth.uid() = user_id);
create policy "Users can manage own streaks" on public.streaks for all using (auth.uid() = user_id);
create policy "Achievements are public" on public.achievements for select using (true);
create policy "Users can view own achievements" on public.user_achievements for select using (auth.uid() = user_id);
create policy "System can insert achievements" on public.user_achievements for insert with check (auth.uid() = user_id);
create policy "Users can manage own ai history" on public.ai_history for all using (auth.uid() = user_id);
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Users can manage own push subs" on public.push_subscriptions for all using (auth.uid() = user_id);
create policy "Users can view own xp" on public.xp_transactions for select using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS E TRIGGERS
-- ============================================================

-- Criar perfil automaticamente após registro
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_vocabulary_updated
  before update on public.vocabulary
  for each row execute procedure public.handle_updated_at();

-- Adicionar XP e verificar level up
create or replace function public.add_xp(p_user_id uuid, p_amount integer, p_reason text, p_task_id uuid default null)
returns jsonb language plpgsql security definer as $$
declare
  v_current_xp integer;
  v_new_xp integer;
  v_current_level integer;
  v_new_level integer;
  v_leveled_up boolean := false;
begin
  select xp_total, xp_level into v_current_xp, v_current_level
  from public.profiles where id = p_user_id;

  v_new_xp := v_current_xp + p_amount;
  -- Fórmula de level: cada nível requer 100 * level^1.5 XP
  v_new_level := floor(power(v_new_xp / 100.0, 1.0/1.5))::integer + 1;
  v_leveled_up := v_new_level > v_current_level;

  update public.profiles
  set xp_total = v_new_xp, xp_level = v_new_level, updated_at = now()
  where id = p_user_id;

  insert into public.xp_transactions(user_id, amount, reason, task_id)
  values (p_user_id, p_amount, p_reason, p_task_id);

  return jsonb_build_object(
    'xp_earned', p_amount,
    'new_total', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up
  );
end;
$$;

-- ============================================================
-- SEED: Conquistas Iniciais
-- ============================================================

insert into public.achievements (slug, title, description, icon, category, xp_reward, requirement) values
('primeira_tarefa', 'Primeiro Passo', 'Complete sua primeira tarefa', '🎯', 'tasks', 50, '{"tasks_completed": 1}'),
('sequencia_3', 'Em Chamas', '3 dias seguidos de estudo', '🔥', 'streak', 100, '{"streak": 3}'),
('sequencia_7', 'Uma Semana Forte', '7 dias seguidos de estudo', '⚡', 'streak', 200, '{"streak": 7}'),
('sequencia_30', 'Mês Perfeito', '30 dias seguidos de estudo', '👑', 'streak', 500, '{"streak": 30}'),
('xp_500', 'Aprendiz', 'Acumule 500 XP', '⭐', 'xp', 100, '{"xp": 500}'),
('xp_1000', 'Estudante', 'Acumule 1000 XP', '🌟', 'xp', 150, '{"xp": 1000}'),
('xp_5000', 'Fluente em Progresso', 'Acumule 5000 XP', '💫', 'xp', 300, '{"xp": 5000}'),
('vocab_50', 'Vocabularista', 'Aprenda 50 palavras', '📚', 'vocabulary', 150, '{"vocabulary": 50}'),
('vocab_200', 'Dicionário Vivo', 'Aprenda 200 palavras', '📖', 'vocabulary', 300, '{"vocabulary": 200}'),
('tasks_10', 'Dedicado', 'Complete 10 tarefas', '✅', 'tasks', 100, '{"tasks_completed": 10}'),
('tasks_50', 'Incansável', 'Complete 50 tarefas', '🏆', 'tasks', 250, '{"tasks_completed": 50}'),
('tasks_100', 'Centenário', 'Complete 100 tarefas', '💯', 'tasks', 500, '{"tasks_completed": 100}'),
('madrugador', 'Madrugador', 'Complete uma tarefa antes das 7h', '🌅', 'special', 150, '{"special": "early_bird"}'),
('noturno', 'Coruja Noturna', 'Complete uma tarefa depois das 22h', '🦉', 'special', 150, '{"special": "night_owl"}'),
('perfeito', 'Perfeicionista', 'Complete 5 tarefas com 100% de acerto', '💎', 'special', 200, '{"perfect_tasks": 5}');
