/*
# Fix RLS policies on conteudo_semanal

1. Overview
The existing policies on conteudo_semanal use an inline subquery to
profiles.role. This migration replaces them with the project-standard
is_admin_or_editor() SECURITY DEFINER function for consistency and to
benefit from the profiles.role fallback logic already in place.

2. Changes
- Drop the existing "Escrita para admins e editores" (FOR ALL) policy.
- Drop the existing "Leitura para autenticados" (SELECT) policy.
- Create 4 separate CRUD policies matching the project pattern:
  - SELECT: any authenticated user can read.
  - INSERT/UPDATE/DELETE: only admins and editors (via is_admin_or_editor()).
- Add updated_at column to track note/status changes.
*/

ALTER TABLE public.conteudo_semanal
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DROP POLICY IF EXISTS "Escrita para admins e editores" ON public.conteudo_semanal;
DROP POLICY IF EXISTS "Leitura para autenticados" ON public.conteudo_semanal;

CREATE POLICY "sec_select_conteudo_semanal"
  ON public.conteudo_semanal FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "sec_insert_conteudo_semanal"
  ON public.conteudo_semanal FOR INSERT
  TO authenticated WITH CHECK (is_admin_or_editor());

CREATE POLICY "sec_update_conteudo_semanal"
  ON public.conteudo_semanal FOR UPDATE
  TO authenticated USING (is_admin_or_editor()) WITH CHECK (is_admin_or_editor());

CREATE POLICY "sec_delete_conteudo_semanal"
  ON public.conteudo_semanal FOR DELETE
  TO authenticated USING (is_admin_or_editor());
