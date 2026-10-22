// Tipos manuais de selecao_semanal (migration 20261022002441_cria_selecao_semanal do repo do DBA).
// Substituir por Tables<'selecao_semanal'> quando os tipos forem gerados com `supabase gen types`.

export const SELECAO_STATUSES = ['rascunho', 'solicitado', 'gerando', 'concluido', 'erro'] as const;
export type SelecaoStatus = (typeof SELECAO_STATUSES)[number];

export const ORIENTACAO_MAX_LENGTH = 1000;

export type TopicoSelecionado = {
  conteudo_gerado_id: number;
  topico_index: number;
  tema_macro: string;
  pontuacao_relevancia: number;
  sintese: string | null;
  justificativa_pontuacao: string | null;
  data_diario: string;
};

export type TopicoCandidato = TopicoSelecionado & {
  key: string;
};

export type SemanalGerado = {
  id: string;
  status: string | null;
  created_at: string;
};

export type SelecaoSemanal = {
  id: string;
  ciclo_inicio: string;
  ciclo_fim: string;
  topicos_selecionados: TopicoSelecionado[];
  orientacao: string | null;
  status: SelecaoStatus;
  erro_mensagem: string | null;
  criado_por: string;
  solicitado_em: string | null;
  created_at: string;
  updated_at: string;
  semanal_gerado: SemanalGerado | null;
};

export const SELECAO_COLUMNS =
  'id, ciclo_inicio, ciclo_fim, topicos_selecionados, orientacao, status, erro_mensagem, criado_por, solicitado_em, created_at, updated_at, conteudo_semanal(id, status, created_at)';

export function topicoKey(conteudoGeradoId: number, topicoIndex: number): string {
  return `${conteudoGeradoId}:${topicoIndex}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function isSelecaoStatus(value: unknown): value is SelecaoStatus {
  return typeof value === 'string' && (SELECAO_STATUSES as readonly string[]).includes(value);
}

export function parseTopicoSelecionado(raw: unknown): TopicoSelecionado | null {
  if (!isRecord(raw)) return null;
  const conteudoGeradoId = Number(raw.conteudo_gerado_id);
  const topicoIndex = Number(raw.topico_index);
  const pontuacao = Number(raw.pontuacao_relevancia);
  if (!Number.isFinite(conteudoGeradoId) || !Number.isInteger(topicoIndex)) return null;
  if (typeof raw.tema_macro !== 'string' || typeof raw.data_diario !== 'string') return null;
  return {
    conteudo_gerado_id: conteudoGeradoId,
    topico_index: topicoIndex,
    tema_macro: raw.tema_macro,
    pontuacao_relevancia: Number.isFinite(pontuacao) ? pontuacao : 0,
    sintese: optionalString(raw.sintese),
    justificativa_pontuacao: optionalString(raw.justificativa_pontuacao),
    data_diario: raw.data_diario,
  };
}

// O embed de um-para-um pode vir como objeto ou como array, conforme a versão do PostgREST.
function parseSemanalGerado(raw: unknown): SemanalGerado | null {
  const candidate = Array.isArray(raw) ? raw[0] : raw;
  if (!isRecord(candidate) || typeof candidate.id !== 'string') return null;
  return {
    id: candidate.id,
    status: optionalString(candidate.status),
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : '',
  };
}

export function parseSelecaoSemanal(raw: unknown): SelecaoSemanal | null {
  if (!isRecord(raw)) return null;
  if (
    typeof raw.id !== 'string' ||
    typeof raw.ciclo_inicio !== 'string' ||
    typeof raw.ciclo_fim !== 'string' ||
    !isSelecaoStatus(raw.status)
  ) {
    return null;
  }
  const topicos = Array.isArray(raw.topicos_selecionados)
    ? raw.topicos_selecionados
        .map(parseTopicoSelecionado)
        .filter((t): t is TopicoSelecionado => t !== null)
    : [];
  return {
    id: raw.id,
    ciclo_inicio: raw.ciclo_inicio,
    ciclo_fim: raw.ciclo_fim,
    topicos_selecionados: topicos,
    orientacao: optionalString(raw.orientacao),
    status: raw.status,
    erro_mensagem: optionalString(raw.erro_mensagem),
    criado_por: typeof raw.criado_por === 'string' ? raw.criado_por : '',
    solicitado_em: optionalString(raw.solicitado_em),
    created_at: typeof raw.created_at === 'string' ? raw.created_at : '',
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : '',
    semanal_gerado: parseSemanalGerado(raw.conteudo_semanal),
  };
}

export function isSelecaoLocked(status: SelecaoStatus): boolean {
  return status === 'solicitado' || status === 'gerando' || status === 'concluido';
}
