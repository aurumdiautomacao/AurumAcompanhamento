import { type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type PanelProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  action?: ReactNode;
};

export function Panel({ children, className, title, description, action }: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-auro-text-muted/20 bg-auro-surface text-auro-text shadow-sm',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex flex-col gap-2 border-b border-auro-text-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-auro-text">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-auro-text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
