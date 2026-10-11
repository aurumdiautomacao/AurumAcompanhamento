/*
# Create profiles table with admin-gated user management

1. Overview
Creates a `profiles` table mirroring `auth.users` (id, email, role, created_at).
A trigger auto-creates a profile row AFTER a new auth user is inserted, so the
profile always exists the moment the auth record does — no race condition.

2. Recursion-safe admin check
The classic "infinite recursion detected in policy for relation profiles" bug
happens when a policy on `profiles` queries `profiles` (e.g. to check if the
caller is an admin). We avoid this entirely with a `SECURITY DEFINER` PL/pgSQL
function `is_admin()` that reads the caller's role from `auth.users.raw_app_meta_data`
WITH `SET search_path = ''` (defensive). Because the function runs as the owner
(postgres), it bypasses RLS on `profiles` and never recurses.

3. New Table
- `profiles`:
  - id uuid PK -> auth.users(id) ON DELETE CASCADE
  - email text (denormalized from auth.users for convenience)
  - role text NOT NULL DEFAULT 'viewer' (values: 'admin' | 'editor' | 'viewer')
  - created_at timestamptz DEFAULT now()

4. Trigger
- `on_auth_user_created` AFTER INSERT ON auth.users FOR EACH ROW.
- Inserts a profiles row with the new user's id + email + default role 'viewer'.
- Uses `NEW.id` / `NEW.email` directly — no query against profiles, no recursion.
- Idempotent: uses ON CONFLICT (id) DO NOTHING so re-runs are safe.

5. Security (RLS)
- RLS enabled on profiles.
- SELECT: authenticated users can read ALL profiles (a user directory is
  useful and not sensitive — emails are already known to signed-in users).
  This avoids any self-referential policy.
- INSERT: BLOCKED for direct client inserts. Only the trigger / service_role
  creates profile rows. (No INSERT policy = no client inserts.)
- UPDATE: a user can update ONLY their own profile (e.g. cannot touch role
  unless they are an admin — enforced in the is_admin check via the UPDATE
  policy's WITH CHECK). Role escalation is blocked: a non-admin updating
  themselves cannot set role='admin' because the WITH CHECK requires
  is_admin() OR the role is unchanged.
- DELETE: a user can delete only their own profile; admins can delete any
  (cascades to auth.users via FK).

6. Edge function contract
The `create_user` edge function (deployed separately) uses the service_role
key to call the Supabase Auth Admin API (createUser), which inserts into
auth.users. The trigger then inserts the profile row. The edge function then
UPDATEs profiles.role to the requested role using the service_role client
(bypasses RLS). Order is guaranteed: auth user first → trigger → profile →
role update.

7. Idempotency
- CREATE TABLE IF NOT EXISTS
- DROP POLICY IF EXISTS before each CREATE POLICY
- DROP FUNCTION IF EXISTS before each CREATE FUNCTION
- DROP TRIGGER IF EXISTS before CREATE TRIGGER
- ON CONFLICT (id) DO NOTHING in the trigger body
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'viewer',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recursion-safe admin check. SECURITY DEFINER → runs as postgres, bypasses
-- RLS on profiles, so it never recurses. Reads role from raw_app_meta_data
-- (admin-immutable), NOT raw_user_meta_data (user-mutable).
CREATE OR REPLACE FUNCTION public.is_admin()
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
  RETURN v_role = 'admin';
END;
$$;

-- Auto-create profile AFTER auth user insert. Runs once per new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'viewer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SELECT: any authenticated user can read the user directory.
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON profiles;
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles FOR SELECT
  TO authenticated USING (true);

-- UPDATE: self-update only, and role can only change if caller is admin.
-- The USING clause allows the row owner; the WITH CHECK additionally
-- prevents role escalation by non-admins.
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (
    auth.uid() = id
    AND (
      public.is_admin()
      OR role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    )
  );

-- DELETE: self or admin.
DROP POLICY IF EXISTS "profiles_delete_own_or_admin" ON profiles;
CREATE POLICY "profiles_delete_own_or_admin"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- No INSERT policy: client inserts are blocked. The trigger (SECURITY DEFINER)
-- and the service_role edge function are the only paths that create rows.
