import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SELECAO_COLUMNS, parseSelecaoSemanal, type SelecaoSemanal } from '../types/semanal';

const LIMIT = 8;

type UseSelecoesRecentesResult = {
  data: SelecaoSemanal[];
  isLoading: boolean;
  error: string | null;
};

// refreshKey muda quando a seleção atual é salva ou muda de status.
export function useSelecoesRecentes(refreshKey: string): UseSelecoesRecentesResult {
  const [data, setData] = useState<SelecaoSemanal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecentes() {
      setError(null);
      const { data: rows, error: queryError } = await supabase
        .from('selecao_semanal')
        .select(SELECAO_COLUMNS)
        .order('ciclo_inicio', { ascending: false })
        .limit(LIMIT);
      if (cancelled) return;
      if (queryError) {
        setError('Não foi possível carregar o histórico de seleções.');
        setData([]);
      } else {
        const list: unknown[] = rows ?? [];
        setData(
          list.map(parseSelecaoSemanal).filter((s): s is SelecaoSemanal => s !== null),
        );
      }
      setIsLoading(false);
    }

    fetchRecentes();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { data, isLoading, error };
}
