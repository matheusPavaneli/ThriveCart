import { Check } from 'lucide-react';
import type { QuoteState } from '../basket/useQuote';
import { exampleBaskets } from '../examples';
import { formatCents } from '../format';
import { channelOf, ink } from '../products';

interface ExampleBasketsProps {
  codes: readonly string[];
  quoteState: QuoteState;
  nameOf: (code: string) => string;
  onPick: (codes: readonly string[]) => void;
}

export function ExampleBaskets({ codes, quoteState, nameOf, onPick }: ExampleBasketsProps) {
  const current = codes.join(',');
  return (
    <section aria-labelledby="examples-heading" className="grid gap-4">
      <h2 id="examples-heading" className="text-lg font-semibold">
        Try an example basket
      </h2>
      <ul className="flex flex-wrap gap-3">
        {exampleBaskets.map((example) => {
          const key = example.codes.join(',');
          const active = key === current;
          const matches = active && quoteState.status === 'ready' && quoteState.quote.total === example.expectedTotal;
          return (
            <li key={key}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${example.codes.map(nameOf).join(', ')}. Expected total ${formatCents(example.expectedTotal)}${matches ? ', matches' : ''}`}
                onClick={() => onPick(example.codes)}
                className={`button-press flex items-center gap-3 rounded-pill py-2 pl-3 pr-4 text-base ring-1 ring-inset ${
                  active ? 'bg-white ring-ink/30' : 'ring-ink/15 hover:bg-white/60'
                }`}
              >
                <span aria-hidden="true" className="flex gap-1">
                  {example.codes.map((code, i) => {
                    const channel = channelOf(code);
                    return <span key={i} className={`size-2.5 rounded-pill ${channel ? ink[channel] : 'bg-slate'}`} />;
                  })}
                </span>
                <span className="figures">{formatCents(example.expectedTotal)}</span>
                {matches && <Check aria-hidden="true" size={16} strokeWidth={2.5} className="text-green-ink" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
