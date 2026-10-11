/*
# Add categoria column and enable RLS on fontes_noticias

1. Overview
This migration does two things:
- Adds a new `categoria` column to the `noticias_brutas` table so each raw news
  item can be classified by category (e.g. "Mercado", "Imóveis", "Macro").
  The column is nullable so existing rows are not affected.
- Enables Row Level Security on `fontes_noticias` and adds the four CRUD
  policies (SELECT/INSERT/UPDATE/DELETE) scoped to authenticated users.
  `fontes_noticias` had RLS disabled, meaning any client could read/write it.
  The app has a sign-in screen, so policies are scoped TO authenticated.

2. Modified Tables
- `noticias_brutas`
  - New column: `categoria` (text, nullable, no default). Stores the news
    category label shown on the Central de Notícias screen.
- `fontes_noticias`
  - RLS enabled.
  - Four policies added (select/insert/update/delete) for authenticated users.

3. Security
- `fontes_noticias` now has RLS enabled with authenticated-only CRUD. Previously
  RLS was off, so the anon role could read/write freely. Now only signed-in
  users can manage news sources.
- `noticias_brutas` RLS is unchanged (already had authenticated policies from
  the original migration). Adding a nullable column does not require policy
  changes.

4. Important notes
- The `categoria` column is nullable and has no default, so the insert path
  used by the news ingestion pipeline is unaffected until it starts sending
  the field.
- No data is lost: ALTER TABLE ADD COLUMN is non-destructive.
- Policies use DROP POLICY IF EXISTS before CREATE for idempotency.
*/

-- 1. Add categoria column to noticias_brutas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'noticias_brutas' AND column_name = 'categoria'
  ) THEN
    ALTER TABLE public.noticias_brutas ADD COLUMN categoria text;
  END IF;
END $$;

-- 2. Enable RLS on fontes_noticias
ALTER TABLE public.fontes_noticias ENABLE ROW LEVEL SECURITY;

-- 3. CRUD policies for fontes_noticias (authenticated only)
DROP POLICY IF EXISTS "auth_select_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "auth_select_fontes_noticias" ON public.fontes_noticias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "auth_insert_fontes_noticias" ON public.fontes_noticias
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "auth_update_fontes_noticias" ON public.fontes_noticias
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_fontes_noticias" ON public.fontes_noticias;
CREATE POLICY "auth_delete_fontes_noticias" ON public.fontes_noticias
  FOR DELETE TO authenticated USING (true);
