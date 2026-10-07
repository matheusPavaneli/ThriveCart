import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import type { Quote } from '../api/schema';
import { useQuote } from './useQuote';

const quote = (total: number): Quote => ({ subtotal: total, discount: 0, delivery: 0, total, nextTier: null });

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe('useQuote', () => {
  it('shows only the latest basket when two quotes are in flight', async () => {
    const first = deferred<Quote>();
    const second = deferred<Quote>();
    const fetcher = vi.fn((codes: readonly string[]) => (codes.length === 1 ? first.promise : second.promise));

    const { result, rerender } = renderHook(({ codes }) => useQuote(codes, fetcher), {
      initialProps: { codes: ['R01'] as readonly string[] },
    });
    rerender({ codes: ['R01', 'R01'] });

    await act(async () => second.resolve(quote(5437)));
    await act(async () => first.resolve(quote(3790)));

    expect(result.current.state).toEqual({ status: 'ready', quote: quote(5437) });
  });

  it('keeps the last good quote, marked stale, when a later one fails', async () => {
    const fetcher = vi
      .fn<(codes: readonly string[]) => Promise<Quote>>()
      .mockResolvedValueOnce(quote(3790))
      .mockRejectedValueOnce(new ApiError("The basket service isn't responding.", 'unreachable', null));

    const { result, rerender } = renderHook(({ codes }) => useQuote(codes, fetcher), {
      initialProps: { codes: ['R01'] as readonly string[] },
    });
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    rerender({ codes: ['R01', 'R01'] });

    await waitFor(() => expect(result.current.state.status).toBe('stale'));
    expect(result.current.state).toMatchObject({ quote: quote(3790), error: { code: 'unreachable' } });
  });

  it('fails without a quote when the first request fails, and retry fetches again', async () => {
    const fetcher = vi
      .fn<(codes: readonly string[]) => Promise<Quote>>()
      .mockRejectedValueOnce(new ApiError('down', 'unreachable', null))
      .mockResolvedValueOnce(quote(495));

    const { result } = renderHook(() => useQuote([], fetcher));
    await waitFor(() => expect(result.current.state.status).toBe('failed'));

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.state).toEqual({ status: 'ready', quote: quote(495) }));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('wraps a non-API failure in an ApiError that keeps the cause', async () => {
    const cause = new TypeError('boom');
    const fetcher = vi.fn<(codes: readonly string[]) => Promise<Quote>>().mockRejectedValue(cause);

    const { result } = renderHook(() => useQuote([], fetcher));

    await waitFor(() => expect(result.current.state.status).toBe('failed'));
    const state = result.current.state;
    expect(state.status === 'failed' ? state.error.cause : null).toBe(cause);
  });
});
