import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

// Converte as datas para Unix Timestamps (Exigência da nova API da OpenAI)
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

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const apiKey = body.openai_api_key;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return json({ error: "openai_api_key is required." }, 400);
  }

  const { startUnix, endUnix, startStr, endStr } = monthRangeUTC();

  try {
    // Comunicação usando os parâmetros corretos: start_time e end_time
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
        {
          error: "Chave da OpenAI inválida ou sem permissão. Certifique-se de usar uma Service Account Key.",
          code: "invalid_api_key",
        },
        401
      );
    }

    if (!upstream.ok) {
      const text = await upstream.text();
      return json(
        {
          error: `Erro na API da OpenAI (${upstream.status}).`,
          detail: text,
          code: "openai_error",
        },
        upstream.status
      );
    }

    const costs = await upstream.json();
    const rows = Array.isArray(costs.data) ? costs.data : [];

    let totalCost = 0;
    const daily = [];

    // Parseando a nova estrutura de resposta da OpenAI
    for (const row of rows) {
      const dayCost = row.amount?.value ?? 0;
      totalCost += dayCost;
      
      if (row.start_time) {
        const dateStr = new Date(row.start_time * 1000).toISOString().slice(0, 10);
        daily.push({ date: dateStr, cost: Number(dayCost.toFixed(6)) });
      }
    }

    daily.sort((a, b) => (a.date < b.date ? -1 : 1));

    return json({
      total_cost: Number(totalCost.toFixed(6)),
      currency: "USD",
      period: { start: startStr, end: endStr },
      daily,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json(
      { error: "Falha interna ao consultar uso da OpenAI.", detail: message, code: "fetch_failed" },
      502
    );
  }
});