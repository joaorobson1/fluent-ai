-- ============================================================
-- Fluent AI — Migration Completa
-- ============================================================
-- Supabase / PostgreSQL 15+
-- Contém: tabelas, índices, funções, triggers, RLS e seed de conquistas
-- ============================================================

-- ============================================================
-- 0. EXTENSÕES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- busca por similaridade (vocabulário)


-- ============================================================
-- 1. TABELAS
-- ============================================================

-- ------------------------------------------------------------
-- profiles
-- Criada automaticamente via trigger quando o usuário se registra.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT        NOT NULL,
  full_name             TEXT,
  avatar_url            TEXT,
  username              TEXT        UNIQUE,
  level                 TEXT        NOT NULL DEFAULT 'iniciante'
                                    CHECK (level IN ('zero','iniciante','intermediario','avancado')),
  xp_total              INTEGER     NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  xp_level              INTEGER     NOT NULL DEFAULT 1 CHECK (xp_level >= 1),
  current_streak        INTEGER     NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak        INTEGER     NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_at      TIMESTAMPTZ,
  tasks_completed       INTEGER     NOT NULL DEFAULT 0 CHECK (tasks_completed >= 0),
  vocabulary_learned    INTEGER     NOT NULL DEFAULT 0 CHECK (vocabulary_learned >= 0),
  onboarding_completed  BOOLEAN     NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN     NOT NULL DEFAULT true,
  daily_goal            INTEGER     NOT NULL DEFAULT 5 CHECK (daily_goal BETWEEN 1 AND 50),
  preferred_topics      TEXT[]      NOT NULL DEFAULT '{}',
  weak_areas            TEXT[]      NOT NULL DEFAULT '{}',
  timezone              TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Perfil público estendido de cada usuário autenticado.';


-- ------------------------------------------------------------
-- tasks
-- Tarefas diárias geradas por IA para cada usuário.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type         TEXT        NOT NULL
               CHECK (type IN (
                 'traducao','listening','complete_frase','multipla_escolha',
                 'montar_frase','pronuncia','conversa_ia','missao_dia','vocabulario'
               )),
  title        TEXT        NOT NULL,
  description  TEXT,
  content      JSONB       NOT NULL DEFAULT '{}',
  xp_reward    INTEGER     NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
  difficulty   INTEGER     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  topic        TEXT,
  is_daily     BOOLEAN     NOT NULL DEFAULT true,
  order_index  INTEGER     NOT NULL DEFAULT 0,
  unlocked_at  TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.tasks IS 'Tarefas de inglês geradas pela IA, vinculadas a um usuário.';
COMMENT ON COLUMN public.tasks.content IS 'Conteúdo dinâmico tipado por "type" — ver TaskContent em types/index.ts.';
COMMENT ON COLUMN public.tasks.unlocked_at IS 'NULL = bloqueada. Preenchido quando a tarefa anterior é concluída.';


-- ------------------------------------------------------------
-- task_progress
-- Progresso do usuário em cada tarefa. Único por (user_id, task_id).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_progress (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id            UUID        NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  status             TEXT        NOT NULL DEFAULT 'pendente'
                                 CHECK (status IN ('pendente','em_andamento','concluida','pulada')),
  attempts           INTEGER     NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  score              INTEGER               CHECK (score BETWEEN 0 AND 100),
  time_spent_seconds INTEGER               CHECK (time_spent_seconds >= 0),
  answer             JSONB,
  ai_feedback        TEXT,
  xp_earned          INTEGER     NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  completed_at       TIMESTAMPTZ,
  started_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_task_progress_user_task UNIQUE (user_id, task_id)
);

COMMENT ON TABLE public.task_progress IS 'Progresso do usuário em cada tarefa. Upsert em (user_id, task_id).';


-- ------------------------------------------------------------
-- vocabulary
-- Palavras aprendidas pelo usuário (spaced repetition).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word                TEXT           NOT NULL,
  translation         TEXT           NOT NULL,
  pronunciation       TEXT,
  phonetic            TEXT,
  example_sentence    TEXT,
  example_translation TEXT,
  audio_url           TEXT,
  image_url           TEXT,
  category            TEXT,
  difficulty          INTEGER        NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  tags                TEXT[]         NOT NULL DEFAULT '{}',
  times_seen          INTEGER        NOT NULL DEFAULT 0 CHECK (times_seen >= 0),
  times_correct       INTEGER        NOT NULL DEFAULT 0 CHECK (times_correct >= 0),
  last_reviewed_at    TIMESTAMPTZ,
  next_review_at      TIMESTAMPTZ,
  mastery_level       INTEGER        NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  ease_factor         NUMERIC(4,2)   NOT NULL DEFAULT 2.5 CHECK (ease_factor >= 1.3),
  interval_days       INTEGER        NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  is_mastered         BOOLEAN        NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vocabulary_user_word UNIQUE (user_id, word)
);

COMMENT ON TABLE  public.vocabulary IS 'Vocabulário pessoal com suporte a spaced-repetition (SM-2).';
COMMENT ON COLUMN public.vocabulary.ease_factor IS 'Fator de facilidade SM-2. Mínimo 1.3.';


-- ------------------------------------------------------------
-- streaks
-- Registro diário de atividade por usuário. Único por (user_id, date).
-- goal_met é calculado automaticamente por trigger.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.streaks (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  tasks_done INTEGER     NOT NULL DEFAULT 0 CHECK (tasks_done >= 0),
  xp_earned  INTEGER     NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  goal_met   BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_streaks_user_date UNIQUE (user_id, date)
);

COMMENT ON TABLE  public.streaks IS 'Histórico diário de atividade. goal_met atualizado via trigger.';
COMMENT ON COLUMN public.streaks.goal_met IS 'true quando tasks_done >= profiles.daily_goal do usuário.';


-- ------------------------------------------------------------
-- achievements
-- Catálogo global de conquistas (leitura pública, escrita apenas service_role).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        UNIQUE NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT '🏆',
  category    TEXT        NOT NULL
              CHECK (category IN ('streak','xp','tasks','vocabulary','special')),
  xp_reward   INTEGER     NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  requirement JSONB       NOT NULL DEFAULT '{}',
  is_hidden   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.achievements IS 'Catálogo de conquistas disponíveis (global, read-only para usuários).';
COMMENT ON COLUMN public.achievements.requirement IS 'Ex: {"streak":7} ou {"tasks_completed":10} — validado no client.';


-- ------------------------------------------------------------
-- user_achievements
-- Conquistas desbloqueadas por usuário.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID        NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seen           BOOLEAN     NOT NULL DEFAULT false,

  CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

COMMENT ON TABLE public.user_achievements IS 'Conquistas desbloqueadas por usuário.';


-- ------------------------------------------------------------
-- xp_transactions
-- Log imutável de ganhos de XP. Escrito apenas via função add_xp().
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         INTEGER     NOT NULL CHECK (amount > 0),
  reason         TEXT        NOT NULL,
  task_id        UUID        REFERENCES public.tasks(id) ON DELETE SET NULL,
  achievement_id UUID        REFERENCES public.achievements(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.xp_transactions IS 'Histórico imutável de XP ganho. Inserido apenas por add_xp().';


-- ============================================================
-- 2. ÍNDICES
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email           ON public.profiles (email);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id            ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_daily_user_date    ON public.tasks (user_id, is_daily, generated_at DESC)
  WHERE is_daily = true;
CREATE INDEX IF NOT EXISTS idx_tasks_unlocked           ON public.tasks (user_id, order_index)
  WHERE unlocked_at IS NULL;

-- task_progress
CREATE INDEX IF NOT EXISTS idx_task_progress_user       ON public.task_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_task       ON public.task_progress (task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_status     ON public.task_progress (user_id, status);

-- vocabulary
CREATE INDEX IF NOT EXISTS idx_vocabulary_user          ON public.vocabulary (user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_review        ON public.vocabulary (user_id, next_review_at)
  WHERE is_mastered = false;
CREATE INDEX IF NOT EXISTS idx_vocabulary_word_trgm     ON public.vocabulary USING gin (word gin_trgm_ops);

-- streaks
CREATE INDEX IF NOT EXISTS idx_streaks_user_date        ON public.streaks (user_id, date DESC);

-- user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user   ON public.user_achievements (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unseen ON public.user_achievements (user_id, seen)
  WHERE seen = false;

-- xp_transactions
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user     ON public.xp_transactions (user_id, created_at DESC);


-- ============================================================
-- 3. FUNÇÕES AUXILIARES
-- ============================================================

-- ------------------------------------------------------------
-- xp_for_level(level)
-- Retorna o XP necessário para completar o nível informado.
-- Espelha utils.ts: floor(100 * level^1.5)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.xp_for_level(p_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
BEGIN
  RETURN FLOOR(100.0 * POWER(p_level::FLOAT, 1.5))::INTEGER;
END;
$$;


-- ------------------------------------------------------------
-- calculate_level(xp_total)
-- Determina o nível do usuário a partir do XP acumulado.
-- Retorna o maior level N tal que xp_total >= xp acumulado até N.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql IMMUTABLE STRICT
AS $$
DECLARE
  v_level     INTEGER := 1;
  v_threshold INTEGER := 0;
BEGIN
  LOOP
    v_threshold := v_threshold + public.xp_for_level(v_level);
    EXIT WHEN p_xp < v_threshold OR v_level >= 100;
    v_level := v_level + 1;
  END LOOP;
  RETURN v_level;
END;
$$;


-- ------------------------------------------------------------
-- add_xp(p_user_id, p_amount, p_reason, p_task_id)
-- Chamada pelo servidor após validação de tarefa.
-- 1. Incrementa xp_total no perfil
-- 2. Recalcula xp_level
-- 3. Registra em xp_transactions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.add_xp(
  p_user_id UUID,
  p_amount  INTEGER,
  p_reason  TEXT,
  p_task_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp    INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Incrementa XP e captura o novo total
  UPDATE public.profiles
  SET    xp_total   = xp_total + p_amount,
         updated_at = NOW()
  WHERE  id = p_user_id
  RETURNING xp_total INTO v_new_xp;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado: %', p_user_id;
  END IF;

  -- Recalcula o nível
  v_new_level := public.calculate_level(v_new_xp);

  -- Atualiza o nível apenas se mudou
  UPDATE public.profiles
  SET    xp_level   = v_new_level,
         updated_at = NOW()
  WHERE  id = p_user_id
    AND  xp_level IS DISTINCT FROM v_new_level;

  -- Registra a transação
  INSERT INTO public.xp_transactions (user_id, amount, reason, task_id)
  VALUES (p_user_id, p_amount, p_reason, p_task_id);
END;
$$;

COMMENT ON FUNCTION public.add_xp IS
  'Adiciona XP ao usuário, recalcula level e registra em xp_transactions. Use SECURITY DEFINER — não chamar diretamente do client.';


-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- ------------------------------------------------------------
-- Trigger: criar profile ao cadastrar novo usuário
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------------------------
-- Trigger: atualizar profiles.updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_vocabulary_updated_at ON public.vocabulary;
CREATE TRIGGER trg_vocabulary_updated_at
  BEFORE UPDATE ON public.vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ------------------------------------------------------------
-- Trigger: calcular goal_met no streak automaticamente
-- Compara tasks_done com daily_goal do perfil do usuário.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_streak_goal_met()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_goal INTEGER;
BEGIN
  SELECT daily_goal INTO v_daily_goal
  FROM   public.profiles
  WHERE  id = NEW.user_id;

  NEW.goal_met := (NEW.tasks_done >= COALESCE(v_daily_goal, 5));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_goal_met ON public.streaks;
CREATE TRIGGER trg_streak_goal_met
  BEFORE INSERT OR UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_streak_goal_met();


-- ------------------------------------------------------------
-- Trigger: recalcular current_streak e longest_streak no perfil
-- Disparado APÓS qualquer insert/update em streaks.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_streak()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current  INTEGER := 0;
  v_longest  INTEGER;
  v_check    DATE    := CURRENT_DATE;
  v_has_day  BOOLEAN;
BEGIN
  -- Conta dias consecutivos com goal_met, de hoje para trás
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.streaks
      WHERE  user_id = NEW.user_id
        AND  date    = v_check
        AND  goal_met = true
    ) INTO v_has_day;

    EXIT WHEN NOT v_has_day;

    v_current := v_current + 1;
    v_check   := v_check - INTERVAL '1 day';
    EXIT WHEN v_current > 3650;   -- proteção contra loop infinito
  END LOOP;

  -- Longest streak atual do perfil
  SELECT COALESCE(longest_streak, 0)
  INTO   v_longest
  FROM   public.profiles
  WHERE  id = NEW.user_id;

  UPDATE public.profiles
  SET    current_streak = v_current,
         longest_streak = GREATEST(v_longest, v_current),
         updated_at     = NOW()
  WHERE  id = NEW.user_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_sync_profile ON public.streaks;
CREATE TRIGGER trg_streak_sync_profile
  AFTER INSERT OR UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_streak();


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilita RLS em todas as tabelas
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions  ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "profiles: leitura própria"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: atualização própria" ON public.profiles;

CREATE POLICY "profiles: leitura própria"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: atualização própria"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ------------------------------------------------------------
-- tasks
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tasks: leitura própria"    ON public.tasks;
DROP POLICY IF EXISTS "tasks: inserção própria"   ON public.tasks;
DROP POLICY IF EXISTS "tasks: atualização própria" ON public.tasks;
DROP POLICY IF EXISTS "tasks: exclusão própria"   ON public.tasks;

CREATE POLICY "tasks: leitura própria"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks: inserção própria"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: atualização própria"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks: exclusão própria"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- task_progress
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "task_progress: leitura própria"    ON public.task_progress;
DROP POLICY IF EXISTS "task_progress: inserção própria"   ON public.task_progress;
DROP POLICY IF EXISTS "task_progress: atualização própria" ON public.task_progress;

CREATE POLICY "task_progress: leitura própria"
  ON public.task_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "task_progress: inserção própria"
  ON public.task_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_progress: atualização própria"
  ON public.task_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- vocabulary
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "vocabulary: leitura própria"    ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary: inserção própria"   ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary: atualização própria" ON public.vocabulary;
DROP POLICY IF EXISTS "vocabulary: exclusão própria"   ON public.vocabulary;

CREATE POLICY "vocabulary: leitura própria"
  ON public.vocabulary FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "vocabulary: inserção própria"
  ON public.vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vocabulary: atualização própria"
  ON public.vocabulary FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vocabulary: exclusão própria"
  ON public.vocabulary FOR DELETE
  USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- streaks
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "streaks: leitura própria"    ON public.streaks;
DROP POLICY IF EXISTS "streaks: inserção própria"   ON public.streaks;
DROP POLICY IF EXISTS "streaks: atualização própria" ON public.streaks;

CREATE POLICY "streaks: leitura própria"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "streaks: inserção própria"
  ON public.streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "streaks: atualização própria"
  ON public.streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- achievements — leitura pública, sem escrita para usuários
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "achievements: leitura pública" ON public.achievements;

CREATE POLICY "achievements: leitura pública"
  ON public.achievements FOR SELECT
  USING (true);


-- ------------------------------------------------------------
-- user_achievements
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "user_achievements: leitura própria"    ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements: inserção própria"   ON public.user_achievements;
DROP POLICY IF EXISTS "user_achievements: atualização própria" ON public.user_achievements;

CREATE POLICY "user_achievements: leitura própria"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_achievements: inserção própria"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_achievements: atualização própria"
  ON public.user_achievements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ------------------------------------------------------------
-- xp_transactions — somente leitura para usuários
-- Escrita feita exclusivamente via add_xp() SECURITY DEFINER
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "xp_transactions: leitura própria" ON public.xp_transactions;

CREATE POLICY "xp_transactions: leitura própria"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. PERMISSÕES EXPLÍCITAS
-- ============================================================

-- Garante que o role anon e authenticated possam chamar as funções públicas
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.achievements TO anon, authenticated;

GRANT ALL ON public.profiles          TO authenticated;
GRANT ALL ON public.tasks             TO authenticated;
GRANT ALL ON public.task_progress     TO authenticated;
GRANT ALL ON public.vocabulary        TO authenticated;
GRANT ALL ON public.streaks           TO authenticated;
GRANT ALL ON public.user_achievements TO authenticated;
GRANT SELECT ON public.xp_transactions TO authenticated;

-- add_xp só pode ser chamado pelo service_role (via API route com createAdminClient)
-- O EXECUTE abaixo permite que authenticated chame via RPC se necessário
GRANT EXECUTE ON FUNCTION public.add_xp(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(INTEGER)             TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level(INTEGER)          TO authenticated;


-- ============================================================
-- 7. SEED — CONQUISTAS
-- ============================================================

INSERT INTO public.achievements (slug, title, description, icon, category, xp_reward, requirement, is_hidden)
VALUES

  -- ── Streak ──────────────────────────────────────────────
  ('first_day',
   'Primeiro Passo',
   'Complete sua primeira tarefa do dia.',
   '🌱', 'streak', 10,
   '{"streak": 1}', false),

  ('week_warrior',
   'Guerreiro da Semana',
   'Mantenha uma sequência de 7 dias.',
   '🔥', 'streak', 50,
   '{"streak": 7}', false),

  ('two_weeks',
   'Duas Semanas Seguidas',
   'Mantenha uma sequência de 14 dias.',
   '⚡', 'streak', 100,
   '{"streak": 14}', false),

  ('month_master',
   'Mestre do Mês',
   'Mantenha uma sequência de 30 dias.',
   '🏆', 'streak', 250,
   '{"streak": 30}', false),

  ('hundred_days',
   'Centurião',
   'Incrível! 100 dias consecutivos de estudo.',
   '💎', 'streak', 1000,
   '{"streak": 100}', false),

  -- ── XP ──────────────────────────────────────────────────
  ('xp_first_100',
   'Primeiro XP',
   'Acumule 100 XP no total.',
   '⭐', 'xp', 5,
   '{"xp": 100}', false),

  ('xp_500',
   'Acumulando Conhecimento',
   'Acumule 500 XP no total.',
   '🌟', 'xp', 15,
   '{"xp": 500}', false),

  ('xp_1000',
   'Mil Pontos de Experiência',
   'Acumule 1.000 XP no total.',
   '✨', 'xp', 30,
   '{"xp": 1000}', false),

  ('xp_5000',
   'Expert em Inglês',
   'Acumule 5.000 XP no total.',
   '🚀', 'xp', 100,
   '{"xp": 5000}', false),

  ('xp_10000',
   'Mestre do Idioma',
   'Acumule 10.000 XP. Impressionante!',
   '👑', 'xp', 300,
   '{"xp": 10000}', false),

  -- ── Tarefas ─────────────────────────────────────────────
  ('first_task',
   'Primeira Tarefa',
   'Conclua sua primeira tarefa.',
   '✅', 'tasks', 5,
   '{"tasks_completed": 1}', false),

  ('tasks_10',
   'Aprendiz Dedicado',
   'Conclua 10 tarefas no total.',
   '📚', 'tasks', 20,
   '{"tasks_completed": 10}', false),

  ('tasks_25',
   'Estudante Comprometido',
   'Conclua 25 tarefas no total.',
   '📖', 'tasks', 40,
   '{"tasks_completed": 25}', false),

  ('tasks_50',
   'Meio Centenário',
   'Conclua 50 tarefas no total.',
   '🎯', 'tasks', 75,
   '{"tasks_completed": 50}', false),

  ('tasks_100',
   'Centurião das Tarefas',
   'Conclua 100 tarefas no total.',
   '🏅', 'tasks', 150,
   '{"tasks_completed": 100}', false),

  ('tasks_500',
   'Lenda do Aprendizado',
   'Conclua 500 tarefas. Você é incrível!',
   '🌠', 'tasks', 500,
   '{"tasks_completed": 500}', false),

  -- ── Vocabulário ─────────────────────────────────────────
  ('vocab_first',
   'Primeira Palavra',
   'Aprenda sua primeira palavra em inglês.',
   '🔤', 'vocabulary', 5,
   '{"vocabulary": 1}', false),

  ('vocab_10',
   'Construindo Vocabulário',
   'Aprenda 10 palavras em inglês.',
   '📝', 'vocabulary', 15,
   '{"vocabulary": 10}', false),

  ('vocab_50',
   'Vocabulário em Expansão',
   'Aprenda 50 palavras em inglês.',
   '📘', 'vocabulary', 40,
   '{"vocabulary": 50}', false),

  ('vocab_100',
   'Cem Palavras',
   'Aprenda 100 palavras em inglês.',
   '📗', 'vocabulary', 75,
   '{"vocabulary": 100}', false),

  ('vocab_500',
   'Dicionário Vivo',
   'Aprenda 500 palavras em inglês.',
   '📙', 'vocabulary', 250,
   '{"vocabulary": 500}', false),

  -- ── Especiais ───────────────────────────────────────────
  ('onboarding_done',
   'Bem-vindo ao Fluent AI!',
   'Complete a configuração inicial do seu perfil.',
   '🎉', 'special', 25,
   '{"onboarding": true}', false),

  ('night_owl',
   'Coruja Noturna',
   'Complete uma tarefa depois das 22h.',
   '🦉', 'special', 20,
   '{"special": "night_owl"}', true),

  ('early_bird',
   'Madrugador',
   'Complete uma tarefa antes das 7h.',
   '🐦', 'special', 20,
   '{"special": "early_bird"}', true),

  ('perfect_score',
   'Perfeição',
   'Obtenha 100% em uma tarefa de tradução.',
   '💯', 'special', 30,
   '{"special": "perfect_score"}', false),

  ('ai_conversation',
   'Papo com IA',
   'Conclua uma conversa completa com a IA.',
   '🤖', 'special', 35,
   '{"special": "ai_conversation"}', false)

ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- 8. NOTA SOBRE BUG CONHECIDO
-- ============================================================
-- Em tasks/validate/route.ts, o upsert de streaks usa:
--   { tasks_done: 1 }
-- O que sobrescreve ao invés de incrementar. O trigger
-- `trg_streak_goal_met` calcula goal_met corretamente de
-- qualquer forma. Para incremento real, a rota deveria chamar:
--
--   supabase.rpc("increment_streak", { p_user_id, p_date, p_xp })
--
-- Função de conveniência abaixo (não chamada ainda pelo app):
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_streak(
  p_user_id UUID,
  p_date    DATE,
  p_xp      INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.streaks (user_id, date, tasks_done, xp_earned)
  VALUES (p_user_id, p_date, 1, p_xp)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    tasks_done = public.streaks.tasks_done + 1,
    xp_earned  = public.streaks.xp_earned  + EXCLUDED.xp_earned;
END;
$$;

COMMENT ON FUNCTION public.increment_streak IS
  'Substituto correto do upsert direto em streaks. Incrementa tasks_done em vez de sobrescrever.';
