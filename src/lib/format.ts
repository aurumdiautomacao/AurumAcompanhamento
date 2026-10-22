// Offset fixo de Brasília (sem horário de verão desde 2019).
const BRT_OFFSET = '-03:00';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const scoreFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat('pt-BR');

// Aceita "dd/mm/aaaa", "aaaa-mm-dd" (data local, sem deslocar para UTC) e ISO completo.
export function parseFlexibleDate(value: string): Date | null {
  const trimmed = value.trim();
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (br) {
    const date = new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoDate) {
    const date = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string): string {
  const date = parseFlexibleDate(value);
  return date ? dateFormatter.format(date) : value;
}

export function formatDateShort(value: string): string {
  const date = parseFlexibleDate(value);
  return date ? shortDateFormatter.format(date) : value;
}

export function formatDateTime(value: string): string {
  const date = parseFlexibleDate(value);
  return date ? dateTimeFormatter.format(date) : value;
}

export function formatCycle(inicio: string, fim: string): string {
  return `${formatDateShort(inicio)} – ${formatDateShort(fim)}`;
}

export function formatScore(value: number): string {
  return scoreFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

// Data local no formato aaaa-mm-dd.
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(isoDate: string, days: number): string {
  const base = parseFlexibleDate(isoDate) ?? new Date();
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toIsoDate(next);
}

// Ciclo padrão: os 7 dias que terminam hoje.
export function defaultCycle(today: Date = new Date()): { inicio: string; fim: string } {
  const fim = toIsoDate(today);
  return { inicio: addDays(fim, -6), fim };
}

// Limites do ciclo em timestamptz (horário de Brasília), dias inclusivos.
export function cycleBounds(inicio: string, fim: string): { from: string; to: string } {
  return {
    from: `${inicio}T00:00:00${BRT_OFFSET}`,
    to: `${fim}T23:59:59.999${BRT_OFFSET}`,
  };
}
