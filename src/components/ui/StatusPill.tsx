import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'highlight';

type StatusPillProps = {
  tone: StatusTone;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  neutral: 'border-auro-text-muted/30 bg-auro-surface-muted text-auro-text-muted',
  info: 'border-auro-primary/30 bg-auro-primary/10 text-auro-primary',
  success: 'border-auro-success/30 bg-auro-success/10 text-auro-success',
  warning: 'border-auro-warning/30 bg-auro-warning/10 text-auro-warning',
  danger: 'border-auro-danger/30 bg-auro-danger/10 text-auro-danger',
  highlight: 'border-auro-gold/40 bg-auro-gold/10 text-auro-gold',
};

export function StatusPill({ tone, children, icon, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums',
        toneClasses[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
