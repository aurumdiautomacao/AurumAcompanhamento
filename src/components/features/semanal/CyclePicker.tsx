import { CalendarRange } from 'lucide-react';
import { Button } from '../../ui/Button';
import { defaultCycle } from '../../../lib/format';

type CyclePickerProps = {
  inicio: string;
  fim: string;
  onChange: (cycle: { inicio: string; fim: string }) => void;
};

export function CyclePicker({ inicio, fim, onChange }: CyclePickerProps) {
  function handleInicio(value: string) {
    if (!value) return;
    onChange({ inicio: value, fim: value > fim ? value : fim });
  }

  function handleFim(value: string) {
    if (!value) return;
    onChange({ inicio: value < inicio ? value : inicio, fim: value });
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="ciclo-inicio" className="text-xs font-medium text-auro-text-muted">
          Início do ciclo
        </label>
        <input
          id="ciclo-inicio"
          type="date"
          value={inicio}
          max={fim}
          onChange={(e) => handleInicio(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-auro-text-muted/30 bg-auro-surface px-3 py-2 text-sm text-auro-text focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary sm:w-auto"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="ciclo-fim" className="text-xs font-medium text-auro-text-muted">
          Fim do ciclo
        </label>
        <input
          id="ciclo-fim"
          type="date"
          value={fim}
          min={inicio}
          onChange={(e) => handleFim(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-auro-text-muted/30 bg-auro-surface px-3 py-2 text-sm text-auro-text focus:outline-none focus-visible:ring-2 focus-visible:ring-auro-primary sm:w-auto"
        />
      </div>
      <Button
        variant="ghost"
        className="col-span-2 sm:col-span-1"
        icon={<CalendarRange size={16} aria-hidden="true" />}
        onClick={() => onChange(defaultCycle())}
      >
        Últimos 7 dias
      </Button>
    </div>
  );
}
