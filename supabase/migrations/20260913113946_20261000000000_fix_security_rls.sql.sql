/*
# Security RLS hardening — post-audit fixes

1. Overview
This migration fixes critical RLS vulnerabilities identified in a security audit:
- noticias_brutas, conteudo_gerado, posts_gerados had RLS DISABLED — any anon-key
  client could read and modify all content.
- fontes_noticias had RLS enabled but with permissive USING(true) policies.
- profiles SELECT allowed any authenticated user to read ALL profiles.
- profiles.role column was client-updatable (escalation risk).

This migration does NOT alter or drop old migrations. It only adds corrective
policies on top of the existing schema.

2. Strategy
- Enable RLS on noticias_brutas, conteudo_gerado, posts_gerados.
- Drop all old permissive policies on noticias_brutas, conteudo_gerado,
  posts_gerados, fontes_noticias, and profiles.
- Recreate policies:
  - Content tables (noticias_brutas, conteudo_gerado, posts_gerados, fontes_noticias):
    SELECT for all authenticated; INSERT/UPDATE/DELETE only for admin or editor.
  - profiles: SELECT only own row OR admin; UPDATE only own row and NOT the
    role column (column-level revocation); DELETE own row OR admin.
- Add a helper function is_admin_or_editor() for the content-table policies.

3. Tables modified
- noticias_brutas: enable RLS, replace policies.
- conteudo_gerado: enable RLS, replace policies.
- posts_gerados: enable RLS, replace policies.
- fontes_noticias: replace policies (RLS already enabled).
- profiles: replace SELECT and DELETE policies; revoke UPDATE on role column.

4. Security
- Content tables: any authenticated user can read (shared platform content),
  but only admin/editor can write. This prevents a viewer from deleting or
  altering reports and posts.
- profiles: users see only their own profile; admins see all. This prevents
  enumeration of user emails.
- profiles.role: column-level revocation prevents self-escalation even if the
  row-level policy allowed the update. The existing WITH CHECK already guards
  this, but defense-in-depth via column privileges is added.
- is_admin_or_editor(): SECURITY DEFINER, reads role from raw_app_meta_data
  (admin-immutable), avoids RLS recursion.

5. Important notes
- No data is lost; no columns or tables are dropped.
- Old policies are dropped with DROP POLICY IF EXISTS before recreating.
- The existing is_admin() function is reused; a new is_admin_or_editor()
  is added for content-table write policies.
- api_settings, base_de_conhecimento, memoria_agente, radar_palavras are
  not in scope of this audit fix (api_settings already has proper RLS).
*/

-- ============================================================
-- Helper function: is_admin_or_editor()
-- SECURITY DEFINER to avoid RLS recursion on profiles.
-- Reads role from raw_app_meta_data (admin-immutable).
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT COALESCE(
    (auth.jwt() ->> 'raw_app_meta_data')::json ->> 'role',
    (auth.jwt() ->> 'user_role'),
    'viewer'
  ) INTO v_role;
  RETURN v_role IN ('admin', 'editor');
END;
$$;

-- ============================================================
-- noticias_brutas
-- ============================================================
ALTER TABLE public.noticias_brutas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_noticias_brutas" ON public.noticias_brutas;
DROP POLICY IF EXISTS "sec_select_noticias_brutas" ON public.noticias_brutas;
CREATE POLICY "sec_select_noticias_brutas" ON public.noticias_brutas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_noticias_brutas" ON public.noticias_brutas;
DROP POLICY IF EXISTS "sec_insert_noticias_brutas" ON public.noticias_brutas;
CREATE POLICY "sec_insert_noticias_brutas" ON public.noticias_brutas
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_update_noticias_brutas" ON public.noticias_brutas;
DROP POLICY IF EXISTS "sec_update_noticias_brutas" ON public.noticias_brutas;
CREATE POLICY "sec_update_noticias_brutas" ON public.noticias_brutas
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_delete_noticias_brutas" ON public.noticias_brutas;
DROP POLICY IF EXISTS "sec_delete_noticias_brutas" ON public.noticias_brutas;
CREATE POLICY "sec_delete_noticias_brutas" ON public.noticias_brutas
  FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

-- ============================================================
-- conteudo_gerado
-- ============================================================
ALTER TABLE public.conteudo_gerado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_conteudo_gerado" ON public.conteudo_gerado;
DROP POLICY IF EXISTS "sec_select_conteudo_gerado" ON public.conteudo_gerado;
CREATE POLICY "sec_select_conteudo_gerado" ON public.conteudo_gerado
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_conteudo_gerado" ON public.conteudo_gerado;
DROP POLICY IF EXISTS "sec_insert_conteudo_gerado" ON public.conteudo_gerado;
CREATE POLICY "sec_insert_conteudo_gerado" ON public.conteudo_gerado
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_update_conteudo_gerado" ON public.conteudo_gerado;
DROP POLICY IF EXISTS "sec_update_conteudo_gerado" ON public.conteudo_gerado;
CREATE POLICY "sec_update_conteudo_gerado" ON public.conteudo_gerado
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_delete_conteudo_gerado" ON public.conteudo_gerado;
DROP POLICY IF EXISTS "sec_delete_conteudo_gerado" ON public.conteudo_gerado;
CREATE POLICY "sec_delete_conteudo_gerado" ON public.conteudo_gerado
  FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

-- ============================================================
-- posts_gerados
-- ============================================================
ALTER TABLE public.posts_gerados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_posts_gerados" ON public.posts_gerados;
DROP POLICY IF EXISTS "sec_select_posts_gerados" ON public.posts_gerados;
CREATE POLICY "sec_select_posts_gerados" ON public.posts_gerados
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_posts_gerados" ON public.posts_gerados;
DROP POLICY IF EXISTS "sec_insert_posts_gerados" ON public.posts_gerados;
CREATE POLICY "sec_insert_posts_gerados" ON public.posts_gerados
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_update_posts_gerados" ON public.posts_gerados;
DROP POLICY IF EXISTS "sec_update_posts_gerados" ON public.posts_gerados;
CREATE POLICY "sec_update_posts_gerados" ON public.posts_gerados
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_delete_posts_gerados" ON public.posts_gerados;
DROP POLICY IF EXISTS "sec_delete_posts_gerados" ON public.posts_gerados;
CREATE POLICY "sec_delete_posts_gerados" ON public.posts_gerados
  FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

-- ============================================================
-- fontes_noticias
-- ============================================================
DROP POLICY IF EXISTS "auth_select_fontes_noticias" ON public.fontes_noticias;
DROP POLICY IF EXISTS "sec_select_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "sec_select_fontes_noticias" ON public.fontes_noticias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_fontes_noticias" ON public.fontes_noticias;
DROP POLICY IF EXISTS "sec_insert_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "sec_insert_fontes_noticias" ON public.fontes_noticias
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_update_fontes_noticias" ON public.fontes_noticias;
DROP POLICY IF EXISTS "sec_update_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "sec_update_fontes_noticias" ON public.fontes_noticias
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_editor())
  WITH CHECK (public.is_admin_or_editor());

DROP POLICY IF EXISTS "auth_delete_fontes_noticias" ON public.fontes_noticias;
DROP POLICY IF EXISTS "sec_delete_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "sec_delete_fontes_noticias" ON public.fontes_noticias
  FOR DELETE TO authenticated
  USING (public.is_admin_or_editor());

-- ============================================================
-- profiles
-- ============================================================
-- SELECT: only own row OR admin
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "sec_select_profiles" ON public.profiles;
CREATE POLICY "sec_select_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- UPDATE: only own row; role column is protected at column level (below)
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "sec_update_profiles" ON public.profiles;
CREATE POLICY "sec_update_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: own row OR admin
DROP POLICY IF EXISTS "profiles_delete_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "sec_delete_profiles" ON public.profiles;
CREATE POLICY "sec_delete_profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- Column-level protection: revoke UPDATE on the role column from authenticated
-- so no user can self-escalate privileges, even if the row policy allows the
-- update on their own row. Only the service_role (edge function) or a
-- SECURITY DEFINER function can set the role.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (email, created_at) ON public.profiles TO authenticated;
