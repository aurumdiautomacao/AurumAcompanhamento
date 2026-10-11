/*
# Fix is_admin_or_editor to fall back to profiles.role

1. Overview
The is_admin_or_editor() function reads the user's role from
raw_app_meta_data in the JWT. However, when an admin updates a user's role
in the profiles table (via UserManagement), the JWT's raw_app_meta_data is
NOT refreshed until the user re-authenticates. This creates a mismatch:
profiles.role says 'admin' but the JWT still says 'viewer'.

This migration makes is_admin_or_editor() fall back to querying
profiles.role when the JWT metadata says 'viewer' or is missing.

2. Why this matters
The content-table RLS policies (INSERT/UPDATE/DELETE) call
is_admin_or_editor(). If the JWT says 'viewer' but profiles.role is
'admin', the policy blocks the write silently (PostgREST returns no error,
just 0 rows affected). The user sees a visual "saved" confirmation but
nothing persists.

3. Approach
- Rewrite is_admin_or_editor() to first check raw_app_meta_data (fast path,
  no query needed for users whose JWT is current).
- If that returns 'viewer' or null, fall back to a direct query on
  profiles.role. This is safe because the function is SECURITY DEFINER
  (runs as postgres, bypasses RLS, no recursion).
- Also update is_admin() the same way for consistency.
*/

CREATE OR REPLACE FUNCTION public.is_admin_or_editor()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_jwt_role text;
  v_profile_role text;
BEGIN
  v_jwt_role := COALESCE(
    (auth.jwt() ->> 'raw_app_meta_data')::json ->> 'role',
    (auth.jwt() ->> 'user_role'),
    'viewer'
  );

  IF v_jwt_role IN ('admin', 'editor') THEN
    RETURN true;
  END IF;

  SELECT role INTO v_profile_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_profile_role, 'viewer') IN ('admin', 'editor');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_jwt_role text;
  v_profile_role text;
BEGIN
  v_jwt_role := COALESCE(
    (auth.jwt() ->> 'raw_app_meta_data')::json ->> 'role',
    (auth.jwt() ->> 'user_role'),
    'viewer'
  );

  IF v_jwt_role = 'admin' THEN
    RETURN true;
  END IF;

  SELECT role INTO v_profile_role
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_profile_role, 'viewer') = 'admin';
END;
$$;
