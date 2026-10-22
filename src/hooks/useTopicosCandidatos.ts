import { useCallback, useEffect, useState } from 'react';
import { normalizeTopicos, supabase, type TopicoEstrategico } from '../lib/supabaseClient';
import { cycleBounds } from '../lib/format';
import { topicoKey, type TopicoCandidato } from '../types/semanal';

type UseTopicosCandidatosResult = {
  data: TopicoCandidato[];
  diariosCount: number;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

function isTopicosRaw(value: unknown): value is TopicoEstrategico[] | string {
  return Array.isArray(value) || typeof value === 'string';
}

// Achata os tópicos de cada diário. topico_index segue o mesmo índice usado
// pela Central de Aprovação (posição após normalizeTopicos).
function buildCandidatos(rows: unknown[]): TopicoCandidato[] {
  const candidatos: TopicoCandidato[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const record = row as Record<string, unknown>;
    const conteudoGeradoId = Number(record.id);
    const dataDiario = typeof record.created_at === 'string' ? record.created_at : null;
    if (!Number.isFinite(conteudoGeradoId) || !dataDiario) continue;
    const raw = record.topicos_estrategicos;
    const topicos = isTopicosRaw(raw) ? normalizeTopicos(raw) : [];
    topicos.forEach((topico, index) => {
      const pontuacao = Number(topico.pontuacao_relevancia);
      candidatos.push({
        key: topicoKey(conteudoGeradoId, index),
        conteudo_gerado_id: conteudoGeradoId,
        topico_index: index,
        tema_macro: topico.tema_macro,
        pontuacao_relevancia: Number.isFinite(pontuacao) ? pontuacao : 0,
        sintese: topico.sintese?.trim() ? topico.sintese : null,
        justificativa_pontuacao: topico.justificativa_pontuacao?.trim()
          ? topico.justificativa_pontuacao
          : null,
        data_diario: dataDiario,
      });
    });
  }
  return candidatos.sort(
    (a, b) =>
      b.pontuacao_relevancia - a.pontuacao_relevancia ||
      b.data_diario.localeCompare(a.data_diario),
  );
}

// Somente leitura de conteudo_gerado: o resumo diário não é alterado.
export function useTopicosCandidatos(cicloInicio: string, cicloFim: string): UseTopicosCandidatosResult {
  const [data, setData] = useState<TopicoCandidato[]>([]);
  const [diariosCount, setDiariosCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchCandidatos() {
      setIsLoading(true);
      setError(null);
      const { from, to } = cycleBounds(cicloInicio, cicloFim);
      const { data: rows, error: queryError } = await supabase
        .from('conteudo_gerado')
        .select('id, created_at, topicos_estrategicos')
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (queryError) {
        setError('Não foi possível carregar os tópicos dos diários do período. Tente atualizar.');
        setData([]);
        setDiariosCount(0);
      } else {
        const list: unknown[] = rows ?? [];
        setData(buildCandidatos(list));
        setDiariosCount(list.length);
      }
      setIsLoading(false);
    }

    fetchCandidatos();
    return () => {
      cancelled = true;
    };
  }, [cicloInicio, cicloFim, reloadToken]);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  return { data, diariosCount, isLoading, error, reload };
}
