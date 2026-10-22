import { StatusPill } from '../../ui/StatusPill';
import { cn } from '../../../lib/cn';
import { formatDateShort, formatScore } from '../../../lib/format';
import type { TopicoSelecionado } from '../../../types/semanal';

type CandidateTopicItemProps = {
  topico: TopicoSelecionado;
  inputId: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
};

export function CandidateTopicItem({ topico, inputId, checked, disabled, onToggle }: CandidateTopicItemProps) {
  const isHighScore = topico.pontuacao_relevancia >= 7;

  return (
    <li
      className={cn(
        'rounded-lg border p-3 transition-colors',
        checked
          ? 'border-auro-primary/50 bg-auro-primary/5'
          : 'border-auro-text-muted/20 bg-auro-surface',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-auro-primary disabled:cursor-not-allowed"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <label
              htmlFor={inputId}
              className={cn(
                'text-sm font-semibold leading-snug text-auro-text',
                disabled ? 'cursor-default' : 'cursor-pointer',
              )}
            >
              {topico.tema_macro}
            </label>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusPill tone="neutral">{formatDateShort(topico.data_diario)}</StatusPill>
              <StatusPill tone={isHighScore ? 'highlight' : 'neutral'}>
                Relevância {formatScore(topico.pontuacao_relevancia)}/10
              </StatusPill>
            </div>
          </div>
          {topico.sintese && (
            <p className="mt-1.5 text-sm leading-relaxed text-auro-text-muted">{topico.sintese}</p>
          )}
          {topico.justificativa_pontuacao && (
            <details className="mt-1.5 text-xs text-auro-text-muted">
              <summary className="cursor-pointer select-none font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary">
                Por que essa nota
              </summary>
              <p className="mt-1 leading-relaxed">{topico.justificativa_pontuacao}</p>
            </details>
          )}
        </div>
      </div>
    </li>
  );
}
