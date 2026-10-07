import NumberFlow from '@number-flow/react';
import type { Quote } from '../api/schema';
import { currencyFormat, formatCents } from '../format';

export function AnimatedPrice({ cents, className = '' }: { cents: number; className?: string }) {
  return (
    <span className={`figures ${className}`}>
      <span aria-hidden="true">
        <NumberFlow value={cents / 100} format={currencyFormat} locales="en-US" />
      </span>
      <span className="sr-only">{formatCents(cents)}</span>
    </span>
  );
}

interface QuoteSummaryProps {
  quote: Quote;
  offerLabel: string;
}

export function QuoteSummary({ quote, offerLabel }: QuoteSummaryProps) {
  const row = 'flex items-baseline justify-between gap-4';
  return (
    <dl className="grid gap-2 text-base">
      <div className={row}>
        <dt className="text-dim">Subtotal</dt>
        <dd>
          <AnimatedPrice cents={quote.subtotal} />
        </dd>
      </div>
      {quote.discount > 0 && (
        <div className={row}>
          <dt className="text-dim">{offerLabel}</dt>
          <dd className="text-green-light">
            <span aria-hidden="true">−</span>
            <span className="sr-only">minus </span>
            <AnimatedPrice cents={quote.discount} />
          </dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-dim">Delivery</dt>
        <dd>{quote.delivery === 0 ? 'Free' : <AnimatedPrice cents={quote.delivery} />}</dd>
      </div>
    </dl>
  );
}
