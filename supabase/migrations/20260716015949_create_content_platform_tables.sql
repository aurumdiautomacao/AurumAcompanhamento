/*
# Create content platform tables

1. Overview
Creates the four core tables for the SaaS content & trends management platform:
noticias_brutas, conteudo_gerado, posts_gerados, and profiles.
The app has a sign-in screen, so policies are scoped TO authenticated
with ownership checks where applicable. noticias_brutas, conteudo_gerado,
and posts_gerados are shared platform content visible to all authenticated
users. profiles is restricted so each user reads/updates only their own row,
while admins (role = 'admin') can read all profiles.

2. New Tables
- `noticias_brutas`: raw news scraped from external sources.
  - id (uuid, pk)
  - status_processamento (text: 'pendente'|'processando'|'concluido'|'falha', default 'pendente')
  - url_fonte (text, source url)
  - nome_fonte (text, source name)
  - titulo (text, title)
  - conteudo_bruto (text, raw body)
  - created_at (timestamptz, default now())
- `conteudo_gerado`: AI-generated trend reports.
  - id (uuid, pk)
  - relatorio_tendencias (text, full report text)
  - created_at (timestamptz, default now())
- `posts_gerados`: social posts derived from a report.
  - id (uuid, pk)
  - conteudo_gerado_id (uuid, fk -> conteudo_gerado.id on delete cascade)
  - plataforma (text: 'instagram'|'linkedin')
  - conteudo (text, post body)
  - status (text: 'pendente'|'aprovado', default 'pendente')
  - created_at (timestamptz, default now())
- `profiles`: public profile linked to auth.users.
  - id (uuid, pk, fk -> auth.users.id on delete cascade)
  - email (text)
  - role (text: 'admin'|'editor'|'viewer', default 'viewer')
  - created_at (timestamptz, default now())

3. Security
- RLS enabled on all four tables.
- noticias_brutas: authenticated can SELECT, INSERT, UPDATE, DELETE (shared content).
- conteudo_gerado: authenticated can SELECT, INSERT, UPDATE, DELETE (shared content).
- posts_gerados: authenticated can SELECT, INSERT, UPDATE (status changes), DELETE.
- profiles: a user can SELECT/UPDATE only their own row; admins can SELECT all rows.
- A trigger (handle_new_user) auto-inserts a profile row when a new auth.users row is created.

4. Important notes
- profiles.id defaults from auth.uid() via the trigger, not a column default, because
  the trigger copies the new user's id directly.
- Email confirmation is OFF by default per project conventions.
- Idempotent: uses IF NOT EXISTS for tables and DROP POLICY IF EXISTS before recreating policies.
*/

CREATE TABLE IF NOT EXISTS noticias_brutas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_processamento text NOT NULL DEFAULT 'pendente',
  url_fonte text,
  nome_fonte text,
  titulo text,
  conteudo_bruto text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE noticias_brutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_noticias_brutas" ON noticias_brutas;
CREATE POLICY "auth_select_noticias_brutas" ON noticias_brutas
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_noticias_brutas" ON noticias_brutas;
CREATE POLICY "auth_insert_noticias_brutas" ON noticias_brutas
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_noticias_brutas" ON noticias_brutas;
CREATE POLICY "auth_update_noticias_brutas" ON noticias_brutas
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_noticias_brutas" ON noticias_brutas;
CREATE POLICY "auth_delete_noticias_brutas" ON noticias_brutas
  FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS conteudo_gerado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_tendencias text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE conteudo_gerado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_conteudo_gerado" ON conteudo_gerado;
CREATE POLICY "auth_select_conteudo_gerado" ON conteudo_gerado
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_conteudo_gerado" ON conteudo_gerado;
CREATE POLICY "auth_insert_conteudo_gerado" ON conteudo_gerado
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_conteudo_gerado" ON conteudo_gerado;
CREATE POLICY "auth_update_conteudo_gerado" ON conteudo_gerado
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_conteudo_gerado" ON conteudo_gerado;
CREATE POLICY "auth_delete_conteudo_gerado" ON conteudo_gerado
  FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS posts_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo_gerado_id uuid REFERENCES conteudo_gerado(id) ON DELETE CASCADE,
  plataforma text NOT NULL DEFAULT 'instagram',
  conteudo text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE posts_gerados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_posts_gerados" ON posts_gerados;
CREATE POLICY "auth_select_posts_gerados" ON posts_gerados
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_posts_gerados" ON posts_gerados;
CREATE POLICY "auth_insert_posts_gerados" ON posts_gerados
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_posts_gerados" ON posts_gerados;
CREATE POLICY "auth_update_posts_gerados" ON posts_gerados
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_posts_gerados" ON posts_gerados;
CREATE POLICY "auth_delete_posts_gerados" ON posts_gerados
  FOR DELETE TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  ));
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS posts_gerados_conteudo_gerado_id_idx
  ON posts_gerados(conteudo_gerado_id);
CREATE INDEX IF NOT EXISTS noticias_brutas_created_at_idx
  ON noticias_brutas(created_at DESC);
CREATE INDEX IF NOT EXISTS conteudo_gerado_created_at_idx
  ON conteudo_gerado(created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();