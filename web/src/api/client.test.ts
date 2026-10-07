import { describe, expect, it, vi } from 'vitest';
import { ApiError, fetchCatalogue, fetchQuote } from './client';

function respond(body: unknown, status = 200) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  );
}

describe('api client', () => {
  it('rejects a response in an unexpected shape, keeping the validation issue as the cause', async () => {
    respond({ subtotal: '65.90' });

    const error = await fetchQuote(['R01']).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'invalid_response', status: 200 });
    expect(error instanceof ApiError ? error.cause : undefined).toBeDefined();
  });

  it('rejects a fractional amount of cents', async () => {
    respond({ subtotal: 10.5, discount: 0, delivery: 0, total: 10.5, nextTier: null });

    await expect(fetchQuote(['R01'])).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it("maps the API's error body to an ApiError with its code", async () => {
    respond({ error: { code: 'unknown_product', message: 'No product with code "X99" in the catalogue.' } }, 422);

    await expect(fetchQuote(['X99'])).rejects.toMatchObject({
      code: 'unknown_product',
      status: 422,
      message: 'No product with code "X99" in the catalogue.',
    });
  });

  it('reports an unreachable service, keeping the network error as the cause', async () => {
    const cause = new TypeError('Failed to fetch');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(cause)),
    );

    const error = await fetchCatalogue().catch((e: unknown) => e);

    expect(error).toMatchObject({ code: 'unreachable', status: null });
    expect(error instanceof ApiError ? error.cause : undefined).toBe(cause);
  });

  it('accepts an offer kind the UI does not know, without a product code', async () => {
    respond({ products: [], delivery: { tiers: [] }, offers: [{ kind: 'other' }] });

    await expect(fetchCatalogue()).resolves.toMatchObject({ offers: [{ kind: 'other' }] });
  });

  it('sends the codes as JSON', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ subtotal: 0, discount: 0, delivery: 495, total: 495, nextTier: null })),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchQuote(['R01', 'B01']);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/quote',
      expect.objectContaining({ method: 'POST', body: '{"codes":["R01","B01"]}' }),
    );
  });
});
