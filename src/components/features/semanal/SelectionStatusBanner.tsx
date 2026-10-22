import { AlertCircle, CheckCircle2, ExternalLink, FileEdit, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { StatusPill } from '../../ui/StatusPill';
import { cn } from '../../../lib/cn';
import { formatDateTime, formatInteger } from '../../../lib/format';
import type { SelecaoSemanal } from '../../../types/semanal';
import { SELECAO_STATUS_META } from './selecaoStatusMeta';

type SelectionStatusBannerProps = {
  selecao: SelecaoSemanal | null;
  onOpenSemanal: (conteudoSemanalId: string) => void;
};

function describe(selecao: SelecaoSemanal): string {
  const total = formatInteger(selecao.topicos_selecionados.length);
  switch (selecao.status) {
    case 'rascunho':
      return `Rascunho com ${total} tópicos, salvo em ${formatDateTime(selecao.updated_at)}. Ainda não enviado para geração.`;
    case 'solicitado':
      return `Pedido enviado${selecao.solicitado_em ? ` em ${formatDateTime(selecao.solicitado_em)}` : ''}. Aguardando o gerador iniciar; a página atualiza a cada 10 s.`;
    case 'gerando':
      return `Gerando o resumo com ${total} tópicos. A página atualiza a cada 10 s.`;
    case 'concluido':
      return `Resumo gerado com ${total} tópicos em ${formatDateTime(selecao.updated_at)}. Revise e aprove na aba Resumos gerados.`;
    case 'erro':
      return `A geração falhou: ${selecao.erro_mensagem ?? 'motivo não informado'}. Revise a seleção e envie de novo.`;
  }
}

export function SelectionStatusBanner({ selecao, onOpenSemanal }: SelectionStatusBannerProps) {
  if (!selecao) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-auro-text-muted/20 bg-auro-surface-muted px-4 py-3 text-sm text-auro-text-muted">
        <FileEdit size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        Nenhuma seleção para este ciclo. Marque os tópicos e salve um rascunho ou gere o resumo.
      </div>
    );
  }

  const meta = SELECAO_STATUS_META[selecao.status];
  const inProgress = selecao.status === 'solicitado' || selecao.status === 'gerando';
  const Icon = inProgress ? Loader2 : selecao.status === 'erro' ? AlertCircle : selecao.status === 'concluido' ? CheckCircle2 : FileEdit;
  const semanalId = selecao.semanal_gerado?.id;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        selecao.status === 'erro'
          ? 'border-auro-danger/30 bg-auro-danger/5'
          : 'border-auro-text-muted/20 bg-auro-surface-muted',
      )}
      role={selecao.status === 'erro' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-2 text-sm text-auro-text">
        <Icon
          size={16}
          className={cn('mt-0.5 shrink-0', inProgress && 'animate-spin', selecao.status === 'erro' && 'text-auro-danger')}
          aria-hidden="true"
        />
        <div className="space-y-1">
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          <p>{describe(selecao)}</p>
        </div>
      </div>
      {selecao.status === 'concluido' && semanalId && (
        <Button
          variant="primary"
          className="shrink-0"
          onClick={() => onOpenSemanal(semanalId)}
          icon={<ExternalLink size={16} aria-hidden="true" />}
        >
          Abrir resumo
        </Button>
      )}
    </div>
  );
}
