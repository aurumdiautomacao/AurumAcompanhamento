import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Envia uma selecao_semanal para o Gerador Semanal do n8n.
// Roda com o JWT do usuário (anon key + Authorization): o RLS de selecao_semanal
// decide quem pode solicitar. Não usa a chave de serviço.
// Secrets: N8N_WEEKLY_WEBHOOK_URL, N8N_WEBHOOK_SECRET.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WEBHOOK_TIMEOUT_MS = 15_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Use POST." }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return json({ error: "Não autorizado." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const webhookUrl = Deno.env.get("N8N_WEEKLY_WEBHOOK_URL") ?? "";
  const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET") ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !webhookUrl || !webhookSecret) {
    return json(
      { error: "O gerador semanal não está configurado. Avise o administrador." },
      500,
    );
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Não autorizado." }, 401);
  }

  let selecaoId = "";
  try {
    const body = await req.json();
    selecaoId = typeof body?.selecao_id === "string" ? body.selecao_id : "";
  } catch {
    return json({ error: "Corpo da requisição inválido." }, 400);
  }
  if (!UUID_RE.test(selecaoId)) {
    return json({ error: "selecao_id inválido." }, 400);
  }

  const { data: selecao, error: readError } = await userClient
    .from("selecao_semanal")
    .select("id, status, topicos_selecionados")
    .eq("id", selecaoId)
    .maybeSingle();

  if (readError) {
    return json({ error: "Não foi possível ler a seleção. Tente de novo." }, 500);
  }
  if (!selecao) {
    return json({ error: "Seleção não encontrada." }, 404);
  }
  if (!Array.isArray(selecao.topicos_selecionados) || selecao.topicos_selecionados.length === 0) {
    return json({ error: "Selecione ao menos 1 tópico para gerar o resumo semanal." }, 422);
  }

  // Update condicional: clique duplo ou seleção já enviada afetam 0 linhas e não chamam o n8n.
  const { data: claimed, error: claimError } = await userClient
    .from("selecao_semanal")
    .update({ status: "solicitado", solicitado_em: new Date().toISOString(), erro_mensagem: null })
    .eq("id", selecaoId)
    .in("status", ["rascunho", "erro"])
    .select("id");

  if (claimError) {
    return json({ error: "Não foi possível enviar a seleção. Tente de novo." }, 500);
  }
  if (!claimed || claimed.length === 0) {
    return json(
      {
        error:
          "A seleção já foi enviada para geração ou seu perfil não tem permissão para enviá-la.",
      },
      409,
    );
  }

  // Sem a chave de serviço não há automation_logs: o rastro da falha fica nos logs da função.
  async function rollback(message: string, reason: string, upstreamStatus: number | null) {
    console.error(
      JSON.stringify({
        fn: "solicitar_resumo_semanal",
        selecao_id: selecaoId,
        reason,
        upstream_status: upstreamStatus,
      }),
    );
    await userClient
      .from("selecao_semanal")
      .update({ status: "erro", erro_mensagem: message })
      .eq("id", selecaoId)
      .eq("status", "solicitado");
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Aurum-Webhook-Secret": webhookSecret,
      },
      body: JSON.stringify({ selecao_id: selecaoId }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    });

    if (upstream.status === 401 || upstream.status === 403) {
      const message = "Não foi possível acionar o gerador. Avise o administrador.";
      await rollback(message, "webhook_unauthorized", upstream.status);
      return json({ error: message }, 502);
    }

    if (!upstream.ok) {
      const message = "O gerador está indisponível no momento. Tente de novo em alguns minutos.";
      await rollback(message, "webhook_not_ok", upstream.status);
      return json({ error: message }, 502);
    }
  } catch (err) {
    const message = "O gerador não respondeu. Tente de novo em alguns minutos.";
    await rollback(
      message,
      err instanceof DOMException && err.name === "TimeoutError" ? "webhook_timeout" : "webhook_network_error",
      null,
    );
    return json({ error: message }, 504);
  }

  return json({ ok: true, selecao_id: selecaoId, status: "solicitado" }, 202);
});
