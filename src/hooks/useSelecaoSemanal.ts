import { useCallback, useEffect, useState } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import {
  SELECAO_COLUMNS,
  parseSelecaoSemanal,
  type SelecaoSemanal,
  type TopicoSelecionado,
} from '../types/semanal';

const POLL_INTERVAL_MS = 10_000;

const MSG_SEM_PERMISSAO =
  'Seu perfil não tem permissão para montar o resumo semanal. Fale com um administrador.';
const MSG_BLOQUEADA =
  'A seleção não foi salva: ela já foi enviada para geração ou seu perfil não tem permissão de edição.';

export type SelecaoDraft = {
  topicos: TopicoSelecionado[];
  orientacao: string;
};

type UseSelecaoSemanalResult = {
  data: SelecaoSemanal | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
  isRequesting: boolean;
  actionError: string | null;
  saveDraft: (draft: SelecaoDraft) => Promise<SelecaoSemanal | null>;
  requestGeneration: (draft: SelecaoDraft) => Promise<boolean>;
  reload: () => void;
};

async function readFunctionError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body: unknown = await error.context.json();
      if (typeof body === 'object' && body !== null && 'error' in body) {
        const message = (body as { error: unknown }).error;
        if (typeof message === 'string' && message.trim()) return message;
      }
    } catch {
      return 'O gerador não respondeu. Tente de novo em alguns minutos.';
    }
  }
  return 'Não foi possível enviar a seleção para geração. Verifique a conexão e tente de novo.';
}

// Uma seleção por ciclo (unique ciclo_inicio + ciclo_fim em selecao_semanal).
export function useSelecaoSemanal(cicloInicio: string, cicloFim: string): UseSelecaoSemanalResult {
  const [data, setData] = useState<SelecaoSemanal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const fetchSelecao = useCallback(async (): Promise<
    { ok: true; selecao: SelecaoSemanal | null } | { ok: false }
  > => {
    const { data: row, error: queryError } = await supabase
      .from('selecao_semanal')
      .select(SELECAO_COLUMNS)
      .eq('ciclo_inicio', cicloInicio)
      .eq('ciclo_fim', cicloFim)
      .maybeSingle();
    if (queryError) return { ok: false };
    return { ok: true, selecao: row ? parseSelecaoSemanal(row) : null };
  }, [cicloInicio, cicloFim]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setActionError(null);
    fetchSelecao().then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.selecao);
      } else {
        setData(null);
        setError('Não foi possível carregar a seleção deste período. Tente atualizar.');
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchSelecao, reloadToken]);

  const status = data?.status;
  useEffect(() => {
    if (status !== 'solicitado' && status !== 'gerando') return;
    const timer = window.setInterval(() => {
      fetchSelecao().then((result) => {
        if (result.ok) setData(result.selecao);
      });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status, fetchSelecao]);

  const saveDraft = useCallback(
    async (draft: SelecaoDraft): Promise<SelecaoSemanal | null> => {
      setIsSaving(true);
      setActionError(null);
      const payload = {
        topicos_selecionados: draft.topicos,
        orientacao: draft.orientacao.trim() || null,
      };

      if (data) {
        const { data: rows, error: updateError } = await supabase
          .from('selecao_semanal')
          .update(payload)
          .eq('id', data.id)
          .select(SELECAO_COLUMNS);
        setIsSaving(false);
        const updated = rows && rows[0] ? parseSelecaoSemanal(rows[0]) : null;
        if (updateError || !updated) {
          setActionError(MSG_BLOQUEADA);
          return null;
        }
        setData(updated);
        return updated;
      }

      const { data: row, error: insertError } = await supabase
        .from('selecao_semanal')
        .insert({ ciclo_inicio: cicloInicio, ciclo_fim: cicloFim, ...payload })
        .select(SELECAO_COLUMNS)
        .single();
      setIsSaving(false);
      if (insertError) {
        if (insertError.code === '42501') {
          setActionError(MSG_SEM_PERMISSAO);
        } else if (insertError.code === '23505') {
          setActionError('Já existe uma seleção para este período. A página foi atualizada; revise e salve de novo.');
          setReloadToken((t) => t + 1);
        } else {
          setActionError('Não foi possível salvar a seleção. Tente de novo.');
        }
        return null;
      }
      const created = parseSelecaoSemanal(row);
      setData(created);
      return created;
    },
    [data, cicloInicio, cicloFim],
  );

  const requestGeneration = useCallback(
    async (draft: SelecaoDraft): Promise<boolean> => {
      if (draft.topicos.length === 0) {
        setActionError('Selecione ao menos 1 tópico para gerar o resumo semanal.');
        return false;
      }
      const saved = await saveDraft(draft);
      if (!saved) return false;

      setIsRequesting(true);
      const { error: invokeError } = await supabase.functions.invoke('solicitar_resumo_semanal', {
        body: { selecao_id: saved.id },
      });
      const result = await fetchSelecao();
      setIsRequesting(false);
      if (result.ok) setData(result.selecao);
      if (invokeError) {
        setActionError(await readFunctionError(invokeError));
        return false;
      }
      return true;
    },
    [saveDraft, fetchSelecao],
  );

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return {
    data,
    isLoading,
    error,
    isSaving,
    isRequesting,
    actionError,
    saveDraft,
    requestGeneration,
    reload,
  };
}
