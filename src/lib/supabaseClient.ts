import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

// Real schema (public):
// noticias_brutas(id uuid, titulo text NOT NULL, conteudo_bruto text NOT NULL,
//   url_fonte text NOT NULL, data_coleta timestamptz default now(),
//   status_processamento text default 'pendente', nome_fonte text)
// conteudo_gerado(id bigint, relatorio_tendencias text NOT NULL,
//   posts_instagram jsonb NOT NULL, posts_linkedin jsonb NOT NULL, created_at timestamptz)
// posts_gerados(id bigint, conteudo_gerado_id bigint nullable,
//   plataforma text NOT NULL, conteudo text NOT NULL, status text default 'pendente',
//   created_at timestamptz default now())
// fontes_noticias(id uuid, nome text, url text, ativo bool, data_cadastro timestamptz,
//   tipo_coleta text)
// base_de_conhecimento(id bigint, nome_cliente text, tom_de_voz text,
//   publico_alvo text, regras_extras text, created_at timestamptz)
// api_settings(id uuid, user_id uuid unique, openai_api_key text, created_at, updated_at)
// NOTE: no `profiles` table exists in this project.

export type NoticiaBruta = {
  id: string;
  titulo: string;
  conteudo_bruto: string;
  url_fonte: string;
  data_coleta: string;
  status_processamento: string | null;
  nome_fonte: string | null;
};

export type TopicoEstrategico = {
  tema_macro: string;
  pontuacao_relevancia: number;
  justificativa_pontuacao?: string;
  sintese?: string;
};

export type ConteudoGerado = {
  id: number;
  relatorio_tendencias: string;
  posts_instagram: string[] | string;
  posts_linkedin: string[] | string;
  topicos_estrategicos?: TopicoEstrategico[] | string | null;
  created_at: string;
};

export type PostGerado = {
  id: number;
  conteudo_gerado_id: number | null;
  plataforma: string;
  conteudo: string;
  status: string | null;
  created_at: string | null;
};

export type FonteNoticia = {
  id: string;
  nome: string;
  url: string;
  ativo: boolean | null;
  data_cadastro: string;
  tipo_coleta: string | null;
};

export type BaseDeConhecimento = {
  id: number;
  nome_cliente: string;
  tom_de_voz: string;
  publico_alvo: string;
  regras_extras: string | null;
  created_at: string;
};

export type ApiSettings = {
  id: string;
  user_id: string;
  openai_api_key: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
};

// Normalize a jsonb posts field that may be string[] or a JSON-encoded string.
export function normalizePosts(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((p): p is string => typeof p === 'string');
      }
    } catch {
      return [];
    }
  }
  return [];
}

// Normalize the topicos_estrategicos jsonb field into a sorted TopicoEstrategico[].
// Handles: TopicoEstrategico[], JSON-encoded string, empty string, null.
export function normalizeTopicos(
  raw: TopicoEstrategico[] | string | null | undefined,
): TopicoEstrategico[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (t) => t && typeof t.tema_macro === 'string',
    ) as TopicoEstrategico[];
  }
  if (typeof raw === 'string') {
    if (raw.trim() === '' || raw.trim() === '""') return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (t) => t && typeof t.tema_macro === 'string',
        ) as TopicoEstrategico[];
      }
    } catch {
      return [];
    }
  }
  return [];
}

// Normalize plataforma ("Linkedin"/"LinkedIn"/"linkedin") to a canonical key.
export function canonicalPlataforma(
  p: string | null | undefined,
): 'instagram' | 'linkedin' | 'other' {
  if (!p) return 'other';
  const v = p.toLowerCase();
  if (v === 'instagram' || v === 'ig') return 'instagram';
  if (v.includes('linked')) return 'linkedin';
  return 'other';
}
