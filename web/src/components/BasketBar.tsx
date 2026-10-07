import { ChevronUp } from 'lucide-react';
import type { Ref } from 'react';
import type { QuoteState } from '../basket/useQuote';
import { AnimatedPrice } from './QuoteSummary';

interface BasketBarProps {
  itemCount: number;
  mix: string;
  quoteState: QuoteState;
  onOpen: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function BasketBar({ itemCount, mix, quoteState, onOpen, ref }: BasketBarProps) {
  const quote = 'quote' in quoteState ? quoteState.quote : null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)]">
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        onClick={onOpen}
        className="screen on-screen relative flex w-full items-center justify-between gap-4 overflow-hidden px-5 py-4 text-left"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-6 top-0 h-0.5 rounded-pill transition-colors duration-(--duration-light)"
          style={{ backgroundColor: itemCount === 0 ? 'transparent' : mix }}
        />
        <span className="grid">
          <span className="text-base font-semibold">View basket</span>
          <span className="figures text-sm text-dim">{itemCount === 1 ? '1 item' : `${itemCount} items`}</span>
        </span>
        <span className="flex items-center gap-3">
          {quote && itemCount > 0 && <AnimatedPrice cents={quote.total} className="display text-xl" />}
          <ChevronUp aria-hidden="true" size={20} />
        </span>
      </button>
    </div>
  );
}
