import { AnimatePresence, m } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import type { ApiError } from '../api/client';
import type { Catalogue } from '../api/schema';
import type { Intensities } from '../basket/mix';
import type { QuoteState } from '../basket/useQuote';
import { channelOf, dot } from '../products';
import { DeliveryMeter } from './DeliveryMeter';
import { ErrorState } from './ErrorState';
import { LightField } from './LightField';
import { QuantityStepper } from './QuantityStepper';
import { AnimatedPrice, QuoteSummary } from './QuoteSummary';

export interface ScreenLine {
  code: string;
  name: string;
  count: number;
}

interface BasketScreenProps {
  lines: readonly ScreenLine[];
  itemCount: number;
  intensities: Intensities;
  mix: string;
  quoteState: QuoteState;
  tiers: Catalogue['delivery']['tiers'];
  offerLabel: string;
  onAdd: (code: string) => void;
  onRemove: (code: string) => void;
  onRetry: () => void;
  renderTitle?: (title: string, className: string) => ReactNode;
  className?: string;
}

export function pricesFailed(error: ApiError): string {
  return error.code === 'unreachable' || error.code === 'timeout'
    ? "Prices can't load because the basket service isn't responding. Start it with docker compose up, then try again."
    : `Prices can't load. ${error.message}`;
}

const spring = { type: 'spring', stiffness: 380, damping: 32 } as const;

export function BasketScreen(props: BasketScreenProps) {
  const { lines, itemCount, intensities, mix, quoteState, tiers, offerLabel, onAdd, onRemove, onRetry } = props;
  const titleClass = 'text-lg font-semibold';
  const empty = itemCount === 0;
  const quote = 'quote' in quoteState ? quoteState.quote : null;

  return (
    <section
      aria-label="Your basket"
      aria-busy={quoteState.status === 'loading' || quoteState.status === 'pending'}
      className={`screen on-screen p-3 ${props.className ?? ''}`}
      style={{ '--mix': empty ? 'transparent' : mix } as CSSProperties}
    >
      <LightField intensities={intensities} className="h-32 sm:h-40" />

      <div className="grid gap-6 px-3 pb-4 pt-6 sm:px-4">
        <div className="flex items-baseline justify-between gap-4">
          {props.renderTitle ? props.renderTitle('Your basket', titleClass) : <h2 className={titleClass}>Your basket</h2>}
          <p className="figures text-sm text-dim">{itemCount === 1 ? '1 item' : `${itemCount} items`}</p>
        </div>

        {empty ? (
          <p className="max-w-[36ch] text-base text-dim">Your basket is empty. Add a widget to switch the screen on.</p>
        ) : (
          <ul className="grid">
            <AnimatePresence initial={false}>
              {lines.map((line) => {
                const channel = channelOf(line.code);
                return (
                  <m.li
                    key={line.code}
                    layout="position"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.16 } }}
                    transition={spring}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-pill ${channel ? dot[channel] : 'bg-dim'}`} />
                      <span className="truncate text-base">{line.name}</span>
                    </span>
                    <QuantityStepper
                      name={line.name}
                      count={line.count}
                      onAdd={() => onAdd(line.code)}
                      onRemove={() => onRemove(line.code)}
                    />
                  </m.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}

        {empty ? null : quoteState.status === 'failed' ? (
          <ErrorState tone="screen" message={pricesFailed(quoteState.error)} onRetry={onRetry} />
        ) : quote === null ? (
          <div aria-hidden="true" className="grid gap-3">
            <div className="h-4 w-full rounded-control bg-white/5" />
            <div className="h-4 w-2/3 rounded-control bg-white/5" />
            <div className="mt-4 h-14 w-1/2 rounded-control bg-white/5" />
          </div>
        ) : (
          <div className={`grid gap-6 transition-opacity duration-(--duration-ui) ${quoteState.status === 'pending' ? 'opacity-70' : ''}`}>
            <QuoteSummary quote={quote} offerLabel={offerLabel} />
            <DeliveryMeter quote={quote} tiers={tiers} mix={mix} />
            <div className="flex items-end justify-between gap-4 border-t border-white/10 pt-5">
              <p className="pb-2 text-base text-dim">Total</p>
              <p className="display text-3xl sm:text-display" data-testid="total">
                <AnimatedPrice cents={quote.total} />
              </p>
            </div>
            {quoteState.status === 'stale' && (
              <ErrorState tone="screen" message="Showing the last prices." onRetry={onRetry} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
