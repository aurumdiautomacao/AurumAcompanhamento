import { ListChecks, Layers } from 'lucide-react';
import { cn } from '../../../lib/cn';

export type WeeklyView = 'montar' | 'resumos';

type WeeklyViewTabsProps = {
  view: WeeklyView;
  onChange: (view: WeeklyView) => void;
};

const TABS: { id: WeeklyView; label: string; icon: typeof Layers }[] = [
  { id: 'montar', label: 'Montar semanal', icon: ListChecks },
  { id: 'resumos', label: 'Resumos gerados', icon: Layers },
];

export function WeeklyViewTabs({ view, onChange }: WeeklyViewTabsProps) {
  return (
    <div role="tablist" aria-label="Fechamento semanal" className="mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-auro-text-muted/20">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          onClick={() => onChange(id)}
          className={cn(
            '-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary',
            view === id
              ? 'border-auro-primary text-auro-primary'
              : 'border-transparent text-auro-text-muted hover:text-auro-text',
          )}
        >
          <Icon size={16} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
