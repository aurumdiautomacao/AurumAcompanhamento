import { useMemo, useState } from 'react';
import { useSelecaoSemanal } from '../../../hooks/useSelecaoSemanal';
import { useSelecoesRecentes } from '../../../hooks/useSelecoesRecentes';
import { useTopicosCandidatos } from '../../../hooks/useTopicosCandidatos';
import { defaultCycle } from '../../../lib/format';
import { isSelecaoLocked, topicoKey, type TopicoSelecionado } from '../../../types/semanal';
import { Panel } from '../../ui/Panel';
import { CandidateTopicList } from './CandidateTopicList';
import { CyclePicker } from './CyclePicker';
import { SelectionComposer } from './SelectionComposer';
import { SelectionHistory } from './SelectionHistory';
import { SelectionStatusBanner } from './SelectionStatusBanner';

type WeeklyCurationPanelProps = {
  canEdit: boolean;
  onOpenSemanal: (conteudoSemanalId: string) => void;
};

export function WeeklyCurationPanel({ canEdit, onOpenSemanal }: WeeklyCurationPanelProps) {
  const [cycle, setCycle] = useState(defaultCycle);
  // null = sem edição local; a tela mostra o que está salvo no banco.
  const [draftKeys, setDraftKeys] = useState<Set<string> | null>(null);
  const [draftOrientacao, setDraftOrientacao] = useState<string | null>(null);

  const candidatos = useTopicosCandidatos(cycle.inicio, cycle.fim);
  const selecao = useSelecaoSemanal(cycle.inicio, cycle.fim);
  const saved = selecao.data;
  const recentes = useSelecoesRecentes(`${saved?.id ?? ''}|${saved?.status ?? ''}|${saved?.updated_at ?? ''}`);

  const savedKeys = useMemo(
    () => new Set((saved?.topicos_selecionados ?? []).map((t) => topicoKey(t.conteudo_gerado_id, t.topico_index))),
    [saved],
  );
  const selectedKeys = draftKeys ?? savedKeys;
  const orientacao = draftOrientacao ?? saved?.orientacao ?? '';
  const readOnly = !canEdit || (saved !== null && isSelecaoLocked(saved.status));

  function changeCycle(next: { inicio: string; fim: string }) {
    setCycle(next);
    setDraftKeys(null);
    setDraftOrientacao(null);
  }

  function toggle(key: string) {
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setDraftKeys(next);
  }

  // Snapshot enviado ao n8n: dados do candidato atual ou, se o diário saiu da lista, o snapshot salvo.
  function buildDraft() {
    const byKey = new Map<string, TopicoSelecionado>();
    for (const t of saved?.topicos_selecionados ?? []) byKey.set(topicoKey(t.conteudo_gerado_id, t.topico_index), t);
    for (const c of candidatos.data) {
      const { key, ...topico } = c;
      byKey.set(key, topico);
    }
    const topicos = [...selectedKeys]
      .map((key) => byKey.get(key))
      .filter((t): t is TopicoSelecionado => t !== undefined)
      .sort((a, b) => b.pontuacao_relevancia - a.pontuacao_relevancia);
    return { topicos, orientacao };
  }

  async function handleSave() {
    const result = await selecao.saveDraft(buildDraft());
    if (result) {
      setDraftKeys(null);
      setDraftOrientacao(null);
    }
  }

  async function handleGenerate() {
    const ok = await selecao.requestGeneration(buildDraft());
    if (ok) {
      setDraftKeys(null);
      setDraftOrientacao(null);
    }
  }

  return (
    <div className="space-y-5">
      <Panel className="p-4">
        <CyclePicker inicio={cycle.inicio} fim={cycle.fim} onChange={changeCycle} />
      </Panel>

      {selecao.isLoading ? (
        <div className="rounded-xl border border-auro-text-muted/20 bg-auro-surface-muted px-4 py-3 text-sm text-auro-text-muted" role="status">
          Carregando a seleção deste ciclo…
        </div>
      ) : selecao.error ? (
        <div className="flex flex-col gap-2 rounded-xl border border-auro-danger/30 bg-auro-danger/5 px-4 py-3 text-sm text-auro-danger sm:flex-row sm:items-center sm:justify-between" role="alert">
          {selecao.error}
          <button
            type="button"
            onClick={selecao.reload}
            className="self-start font-medium underline focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <SelectionStatusBanner selecao={saved} onOpenSemanal={onOpenSemanal} />
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CandidateTopicList
            candidatos={candidatos.data}
            diariosCount={candidatos.diariosCount}
            isLoading={candidatos.isLoading}
            error={candidatos.error}
            selectedKeys={selectedKeys}
            readOnly={readOnly || selecao.isLoading || selecao.error !== null}
            onToggle={toggle}
            onReload={candidatos.reload}
          />
        </div>
        <div className="space-y-5 lg:col-span-4">
          <div className="lg:sticky lg:top-4 space-y-5">
            <SelectionComposer
              selectedCount={selectedKeys.size}
              orientacao={orientacao}
              readOnly={readOnly || selecao.isLoading || selecao.error !== null}
              canEdit={canEdit}
              isSaving={selecao.isSaving}
              isRequesting={selecao.isRequesting}
              actionError={selecao.actionError}
              onOrientacaoChange={setDraftOrientacao}
              onSave={handleSave}
              onGenerate={handleGenerate}
            />
            <SelectionHistory
              selecoes={recentes.data}
              isLoading={recentes.isLoading}
              error={recentes.error}
              currentId={saved?.id ?? null}
              onPick={changeCycle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
