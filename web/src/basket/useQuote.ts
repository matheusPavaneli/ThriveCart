import { useCallback, useEffect, useState } from 'react';
import { type ApiError, asApiError, fetchQuote } from '../api/client';
import type { Quote } from '../api/schema';

export type QuoteState =
  | { status: 'loading' }
  | { status: 'ready'; quote: Quote }
  | { status: 'pending'; quote: Quote }
  | { status: 'stale'; quote: Quote; error: ApiError }
  | { status: 'failed'; error: ApiError };

type Fetcher = (codes: readonly string[], signal: AbortSignal) => Promise<Quote>;

function lastQuote(state: QuoteState): Quote | null {
  return 'quote' in state ? state.quote : null;
}

export function useQuote(codes: readonly string[], fetcher: Fetcher = fetchQuote) {
  const [state, setState] = useState<QuoteState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const key = codes.join(',');

  useEffect(() => {
    const controller = new AbortController();
    const requested = key === '' ? [] : key.split(',');

    setState((previous) => {
      const quote = lastQuote(previous);
      return quote ? { status: 'pending', quote } : { status: 'loading' };
    });

    fetcher(requested, controller.signal).then(
      (quote) => {
        if (!controller.signal.aborted) setState({ status: 'ready', quote });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = asApiError(error);
        setState((previous) => {
          const quote = lastQuote(previous);
          return quote ? { status: 'stale', quote, error: apiError } : { status: 'failed', error: apiError };
        });
      },
    );

    return () => controller.abort();
  }, [key, attempt, fetcher]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, retry };
}
