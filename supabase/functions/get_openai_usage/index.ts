import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function monthRangeUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59));

  return {
    startUnix: Math.floor(start.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
    startStr: start.toISOString().slice(0, 10),
    endStr: end.toISOString().slice(0, 10),
  };
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

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await authClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Não autorizado." }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  const apiKey = body.openai_api_key;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return json({ error: "Parâmetros obrigatórios ausentes." }, 400);
  }

  const { startUnix, endUnix, startStr, endStr } = monthRangeUTC();

  try {
    const upstream = await fetch(
      `https://api.openai.com/v1/organization/costs?start_time=${startUnix}&end_time=${endUnix}&limit=31`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (upstream.status === 401 || upstream.status === 403) {
      return json(
        { error: "Chave da OpenAI inválida ou sem permissão.", code: "invalid_api_key" },
        401
      );
    }

    if (!upstream.ok) {
      return json(
        { error: "Erro ao processar a requisição com a IA." },
        upstream.status
      );
    }

    const costs = await upstream.json();
    const rows = Array.isArray(costs.data) ? costs.data : [];

    let totalCost = 0;
    const daily = [];

    for (const row of rows) {
      const results = Array.isArray(row.results) ? row.results : [];
      const bucketCost = results.reduce((sum: number, result: any) => {
        const value = Number(result.amount?.value ?? 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
      const legacyCost = Number(row.amount?.value ?? 0);
      const dayCost = results.length > 0 ? bucketCost : legacyCost;
      totalCost += dayCost;

      if (row.start_time) {
        const dateStr = new Date(row.start_time * 1000).toISOString().slice(0, 10);
        daily.push({ date: dateStr, cost: Number(dayCost.toFixed(6)) });
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    if (!daily.some((item) => item.date === todayStr)) {
      daily.push({ date: todayStr, cost: 0 });
    }

    daily.sort((a, b) => (a.date < b.date ? -1 : 1));

    return json({
      total_cost: Number(totalCost.toFixed(6)),
      currency: "USD",
      period: { start: startStr, end: endStr },
      daily,
    });
  } catch {
    return json(
      { error: "Erro ao processar a requisição com a IA." },
      502
    );
  }
});
