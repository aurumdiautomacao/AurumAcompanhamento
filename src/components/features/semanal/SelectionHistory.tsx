import { Loader2 } from 'lucide-react';
import { Panel } from '../../ui/Panel';
import { StatusPill } from '../../ui/StatusPill';
import { cn } from '../../../lib/cn';
import { formatCycle, formatInteger } from '../../../lib/format';
import type { SelecaoSemanal } from '../../../types/semanal';
import { SELECAO_STATUS_META } from './selecaoStatusMeta';

type SelectionHistoryProps = {
  selecoes: SelecaoSemanal[];
  isLoading: boolean;
  error: string | null;
  currentId: string | null;
  onPick: (cycle: { inicio: string; fim: string }) => void;
};

export function SelectionHistory({ selecoes, isLoading, error, currentId, onPick }: SelectionHistoryProps) {
  return (
    <Panel title="Seleções recentes">
      {isLoading ? (
        <div className="flex justify-center py-6 text-auro-text-muted" role="status" aria-label="Carregando seleções">
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        </div>
      ) : error ? (
        <p className="px-4 py-6 text-sm text-auro-danger" role="alert">
          {error}
        </p>
      ) : selecoes.length === 0 ? (
        <p className="px-4 py-6 text-sm text-auro-text-muted">Nenhuma seleção salva até agora.</p>
      ) : (
        <ul className="divide-y divide-auro-text-muted/15">
          {selecoes.map((s) => {
            const meta = SELECAO_STATUS_META[s.status];
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onPick({ inicio: s.ciclo_inicio, fim: s.ciclo_fim })}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-auro-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-auro-primary',
                    s.id === currentId && 'bg-auro-primary/5',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-auro-text">{formatCycle(s.ciclo_inicio, s.ciclo_fim)}</span>
                    <span className="block text-xs tabular-nums text-auro-text-muted">
                      {formatInteger(s.topicos_selecionados.length)} tópicos
                    </span>
                  </span>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
