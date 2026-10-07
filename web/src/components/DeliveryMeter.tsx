import type { CSSProperties } from 'react';
import type { Catalogue, Quote } from '../api/schema';
import { formatCents } from '../format';

interface DeliveryMeterProps {
  quote: Quote;
  tiers: Catalogue['delivery']['tiers'];
  mix: string;
}

function copyFor(nextTier: Quote['nextTier']): string {
  if (nextTier === null) return 'Free delivery';
  const reward = nextTier.charge === 0 ? 'free delivery' : `${formatCents(nextTier.charge)} delivery`;
  return `${formatCents(nextTier.remaining)} more for ${reward}`;
}

export function DeliveryMeter({ quote, tiers, mix }: DeliveryMeterProps) {
  const top = Math.max(0, ...tiers.map((t) => t.below));
  if (top === 0) return null;

  const amount = quote.subtotal - quote.discount;
  const progress = Math.min(1, amount / top);
  const copy = copyFor(quote.nextTier);
  const free = quote.nextTier === null;

  return (
    <div className="grid gap-2.5">
      <div
        role="meter"
        aria-label="Spend toward free delivery"
        aria-valuemin={0}
        aria-valuemax={top / 100}
        aria-valuenow={Math.min(amount, top) / 100}
        aria-valuetext={copy}
        className="relative h-1.5 overflow-hidden rounded-pill bg-white/10"
      >
        <div
          className="meter-fill absolute inset-0 rounded-pill"
          style={{ '--progress': progress.toFixed(4), backgroundColor: free ? 'var(--color-phosphor)' : mix } as CSSProperties}
        />
        {tiers
          .filter((t) => t.below < top)
          .map((t) => (
            <span
              key={t.below}
              aria-hidden="true"
              className="absolute inset-y-0 w-0.5 bg-screen"
              style={{ left: `${(t.below / top) * 100}%` }}
            />
          ))}
      </div>
      <p className={`figures text-sm ${free ? 'text-phosphor' : 'text-dim'}`}>{copy}</p>
    </div>
  );
}
