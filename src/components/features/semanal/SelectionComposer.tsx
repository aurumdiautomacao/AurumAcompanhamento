import { AlertCircle, Save, Sparkles } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Panel } from '../../ui/Panel';
import { formatInteger } from '../../../lib/format';
import { ORIENTACAO_MAX_LENGTH } from '../../../types/semanal';

type SelectionComposerProps = {
  selectedCount: number;
  orientacao: string;
  readOnly: boolean;
  canEdit: boolean;
  isSaving: boolean;
  isRequesting: boolean;
  actionError: string | null;
  onOrientacaoChange: (value: string) => void;
  onSave: () => void;
  onGenerate: () => void;
};

export function SelectionComposer({
  selectedCount,
  orientacao,
  readOnly,
  canEdit,
  isSaving,
  isRequesting,
  actionError,
  onOrientacaoChange,
  onSave,
  onGenerate,
}: SelectionComposerProps) {
  const busy = isSaving || isRequesting;

  return (
    <Panel
      title="Pauta do resumo"
      description="O gerador usa apenas os tópicos marcados e a sua orientação."
    >
      <div className="space-y-4 p-4">
        <p className="text-sm text-auro-text">
          <span className="text-2xl font-semibold tabular-nums">{formatInteger(selectedCount)}</span>{' '}
          {selectedCount === 1 ? 'tópico selecionado' : 'tópicos selecionados'}
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="orientacao-semanal" className="text-xs font-medium text-auro-text-muted">
            Orientação para a IA (opcional)
          </label>
          <textarea
            id="orientacao-semanal"
            value={orientacao}
            maxLength={ORIENTACAO_MAX_LENGTH}
            onChange={(e) => onOrientacaoChange(e.target.value)}
            disabled={readOnly}
            rows={5}
            placeholder="Ex.: linguagem simples, foco no que o proprietário deve fazer com o imóvel."
            className="w-full resize-y rounded-lg border border-auro-text-muted/30 bg-auro-surface px-3 py-2 text-sm text-auro-text placeholder:text-auro-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary disabled:opacity-60"
          />
          <span className="self-end text-xs tabular-nums text-auro-text-muted">
            {formatInteger(orientacao.length)}/{formatInteger(ORIENTACAO_MAX_LENGTH)}
          </span>
        </div>

        {actionError && (
          <p className="flex items-start gap-2 text-sm text-auro-danger" role="alert">
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            {actionError}
          </p>
        )}

        {canEdit ? (
          !readOnly && (
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={onGenerate}
                isLoading={isRequesting}
                disabled={busy || selectedCount === 0}
                icon={<Sparkles size={16} aria-hidden="true" />}
              >
                Gerar resumo semanal
              </Button>
              <Button
                onClick={onSave}
                isLoading={isSaving && !isRequesting}
                disabled={busy}
                icon={<Save size={16} aria-hidden="true" />}
              >
                Salvar rascunho
              </Button>
              {selectedCount === 0 && (
                <p className="text-xs text-auro-text-muted">Selecione ao menos 1 tópico para gerar.</p>
              )}
            </div>
          )
        ) : (
          <p className="text-xs text-auro-text-muted">
            Seu perfil é de leitura. Editores e administradores montam e enviam o resumo semanal.
          </p>
        )}
      </div>
    </Panel>
  );
}
