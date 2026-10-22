import type { StatusTone } from '../../ui/StatusPill';
import type { SelecaoStatus } from '../../../types/semanal';

export const SELECAO_STATUS_META: Record<SelecaoStatus, { label: string; tone: StatusTone }> = {
  rascunho: { label: 'Rascunho', tone: 'neutral' },
  solicitado: { label: 'Na fila', tone: 'info' },
  gerando: { label: 'Gerando', tone: 'info' },
  concluido: { label: 'Gerado', tone: 'success' },
  erro: { label: 'Falhou', tone: 'danger' },
};
