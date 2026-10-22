import { useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { formatInteger } from '../../../lib/format';
import type { TopicoCandidato } from '../../../types/semanal';
import { CandidateTopicItem } from './CandidateTopicItem';

const HIGH_SCORE = 7;

type CandidateTopicListProps = {
  candidatos: TopicoCandidato[];
  diariosCount: number;
  isLoading: boolean;
  error: string | null;
  selectedKeys: ReadonlySet<string>;
  readOnly: boolean;
  onToggle: (key: string) => void;
  onReload: () => void;
};

export function CandidateTopicList({
  candidatos,
  diariosCount,
  isLoading,
  error,
  selectedKeys,
  readOnly,
  onToggle,
  onReload,
}: CandidateTopicListProps) {
  const [onlyHighScore, setOnlyHighScore] = useState(false);
  const highScoreCount = candidatos.filter((c) => c.pontuacao_relevancia >= HIGH_SCORE).length;
  const visible = onlyHighScore
    ? candidatos.filter((c) => c.pontuacao_relevancia >= HIGH_SCORE || selectedKeys.has(c.key))
    : candidatos;

  return (
    <Panel
      title="Tópicos da semana"
      description={`${formatInteger(candidatos.length)} tópicos em ${formatInteger(diariosCount)} diários, ordenados por relevância`}
      action={
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-auro-text-muted">
            <input
              type="checkbox"
              checked={onlyHighScore}
              onChange={(e) => setOnlyHighScore(e.target.checked)}
              className="h-4 w-4 accent-auro-primary"
            />
            Só relevância ≥ {HIGH_SCORE} ({formatInteger(highScoreCount)})
          </label>
          <Button
            variant="ghost"
            className="px-2"
            aria-label="Recarregar tópicos do período"
            onClick={onReload}
            disabled={isLoading}
            icon={<RefreshCw size={16} aria-hidden="true" />}
          />
        </div>
      }
    >
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-auro-text-muted" role="status">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            Carregando tópicos dos diários…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
            <p className="inline-flex items-center gap-2 text-sm text-auro-danger">
              <AlertCircle size={16} aria-hidden="true" />
              {error}
            </p>
            <Button onClick={onReload}>Tentar de novo</Button>
          </div>
        ) : candidatos.length === 0 ? (
          <p className="py-10 text-center text-sm text-auro-text-muted">
            Nenhum diário com tópicos estratégicos neste período. Ajuste as datas do ciclo ou aguarde a
            geração dos diários.
          </p>
        ) : visible.length === 0 ? (
          <p className="py-10 text-center text-sm text-auro-text-muted">
            Nenhum tópico com relevância ≥ {HIGH_SCORE} no período. Desmarque o filtro para ver todos.
          </p>
        ) : (
          <ul className="space-y-2">
            {visible.map((topico) => (
              <CandidateTopicItem
                key={topico.key}
                inputId={`topico-${topico.key.replace(':', '-')}`}
                topico={topico}
                checked={selectedKeys.has(topico.key)}
                disabled={readOnly}
                onToggle={() => onToggle(topico.key)}
              />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
