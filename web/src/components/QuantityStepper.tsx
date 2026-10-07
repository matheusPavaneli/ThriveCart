import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  name: string;
  count: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function QuantityStepper({ name, count, onAdd, onRemove }: QuantityStepperProps) {
  const button =
    'button-press grid size-9 place-items-center rounded-control text-phosphor hover:bg-white/10 disabled:opacity-40';
  return (
    <div className="flex items-center gap-1" role="group" aria-label={`${name} quantity`}>
      <button type="button" className={button} onClick={onRemove} aria-label={`Remove one ${name}`}>
        <Minus aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
      <output className="figures w-6 text-center text-base" aria-live="off">
        {count}
      </output>
      <button type="button" className={button} onClick={onAdd} aria-label={`Add one ${name}`}>
        <Plus aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
    </div>
  );
}
