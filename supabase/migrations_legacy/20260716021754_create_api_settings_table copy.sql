/*
# Per-user OpenAI API settings

1. Overview
Creates `api_settings` so each authenticated user can store their own OpenAI API
token and see their own usage. One row per user (user_id is unique).

2. New Table
- `api_settings`:
  - id uuid pk default gen_random_uuid()
  - user_id uuid NOT NULL unique -> auth.users(id) on delete cascade
  - openai_api_key text (encrypted-at-rest not available in MVP; stored as text)
  - created_at timestamptz default now()
  - updated_at timestamptz default now()

3. Security
- RLS enabled.
- A user can SELECT/INSERT/UPDATE/DELETE only their own row (auth.uid() = user_id).
- No admin override needed for this MVP.

4. Notes
- Idempotent: uses IF NOT EXISTS and DROP POLICY IF EXISTS.
- updated_at auto-bumped via trigger.
*/

CREATE TABLE IF NOT EXISTS api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  openai_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_api_settings" ON api_settings;
CREATE POLICY "select_own_api_settings" ON api_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_api_settings" ON api_settings;
CREATE POLICY "insert_own_api_settings" ON api_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_api_settings" ON api_settings;
CREATE POLICY "update_own_api_settings" ON api_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_api_settings" ON api_settings;
CREATE POLICY "delete_own_api_settings" ON api_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS api_settings_bump_updated_at ON api_settings;
CREATE TRIGGER api_settings_bump_updated_at
  BEFORE UPDATE ON api_settings
  FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();
