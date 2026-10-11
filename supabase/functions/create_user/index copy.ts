import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

interface CreateRequestBody {
  email?: string;
  password?: string;
  role?: string;
}

const VALID_ROLES = new Set(["admin", "editor", "viewer"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json(
      { error: "Server misconfigured: missing service role credentials." },
      500,
    );
  }

  // Verify the caller is authenticated and is an admin BEFORE doing anything.
  // We use the caller's JWT (from the Authorization header) to check their
  // role via raw_app_meta_data, using the service_role client to bypass RLS.
  const authHeader = req.headers.get("Authorization") ?? "";
  const callerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!callerToken || callerToken === "") {
    return json({ error: "Não autenticado." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // Check caller's role from their JWT's raw_app_meta_data.
    const { data: callerInfo, error: callerErr } =
      await adminClient.auth.getUser(callerToken);
    if (callerErr || !callerInfo?.user) {
      return json({ error: "Não autenticado." }, 401);
    }
    const callerRole =
      (callerInfo.user.app_metadata?.role as string | undefined) ?? "viewer";
    if (callerRole !== "admin") {
      return json(
        { error: "Apenas administradores podem criar usuários." },
        403,
      );
    }

    // Parse body.
    let body: CreateRequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body JSON inválido." }, 400);
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";
    const role = (body.role ?? "viewer").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return json({ error: "E-mail inválido." }, 400);
    }
    if (!password || password.length < 6) {
      return json({ error: "A senha deve ter ao menos 6 caracteres." }, 400);
    }
    if (!VALID_ROLES.has(role)) {
      return json(
        { error: `Role inválido. Use: ${[...VALID_ROLES].join(", ")}.` },
        400,
      );
    }

    // Step 1: create the auth user via Admin API. This inserts into
    // auth.users, which fires the `on_auth_user_created` trigger, which
    // inserts the profiles row with role='viewer'. Order is guaranteed:
    // auth user exists before the trigger runs.
    const { data: created, error: createErr } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role },
      });

    if (createErr) {
      return json(
        { error: `Erro ao criar usuário: ${createErr.message}` },
        400,
      );
    }
    if (!created?.user?.id) {
      return json({ error: "Falha inesperada ao criar usuário." }, 500);
    }

    const newUserId = created.user.id;

    // Step 2: set the role in profiles (trigger created it as 'viewer').
    // Use the service_role client so RLS is bypassed.
    const { error: profileErr } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", newUserId);

    if (profileErr) {
      // The user was created in auth but the profile update failed. Log and
      // continue — the trigger already created a 'viewer' profile row, so
      // the user can sign in. An admin can fix the role later.
      console.warn(
        "profiles update failed for",
        newUserId,
        ":",
        profileErr.message,
      );
    }

    return json({
      success: true,
      user: { id: newUserId, email, role },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(
      { error: `Erro interno: ${message}` },
      500,
    );
  }
});
