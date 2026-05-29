-- ============================================================
-- Migration 002 — Policy INSERT para profiles
-- ============================================================
-- Necessária para usuários criados ANTES do trigger handle_new_user.
-- Permite que o browser client (usuário autenticado) crie a própria
-- linha na tabela profiles caso ela não exista.
-- ============================================================

-- Policy de inserção: usuário só pode inserir a própria linha
-- CREATE POLICY não suporta IF NOT EXISTS — usamos DROP antes
DROP POLICY IF EXISTS "profiles: inserção própria" ON public.profiles;
CREATE POLICY "profiles: inserção própria"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Garante permissão de INSERT para o role authenticated
-- (GRANT ALL foi dado na migration 001, mas explicitamos para clareza)
GRANT INSERT ON public.profiles TO authenticated;
