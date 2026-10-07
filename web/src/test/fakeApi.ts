import { vi } from 'vitest';

export const catalogueResponse = {
  products: [
    { code: 'R01', name: 'Red Widget', price: 3295 },
    { code: 'G01', name: 'Green Widget', price: 2495 },
    { code: 'B01', name: 'Blue Widget', price: 795 },
  ],
  delivery: { tiers: [{ below: 5000, charge: 495 }, { below: 9000, charge: 295 }] },
  offers: [{ kind: 'second_half_price', productCode: 'R01' }],
};

export const quoteResponses: Record<string, unknown> = {
  '': { subtotal: 0, discount: 0, delivery: 495, total: 495, nextTier: { remaining: 5000, charge: 295 } },
  R01: { subtotal: 3295, discount: 0, delivery: 495, total: 3790, nextTier: { remaining: 1705, charge: 295 } },
  'R01,R01': { subtotal: 6590, discount: 1648, delivery: 495, total: 5437, nextTier: { remaining: 58, charge: 295 } },
  'B01,G01': { subtotal: 3290, discount: 0, delivery: 495, total: 3785, nextTier: { remaining: 1710, charge: 295 } },
  'R01,G01': { subtotal: 5790, discount: 0, delivery: 295, total: 6085, nextTier: { remaining: 3210, charge: 0 } },
  'B01,B01,R01,R01,R01': { subtotal: 11475, discount: 1648, delivery: 0, total: 9827, nextTier: null },
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export function stubApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    if (url === '/api/catalogue') return json(catalogueResponse);
    if (url === '/api/quote') {
      const { codes } = JSON.parse(String(init?.body)) as { codes: string[] };
      const quote = quoteResponses[codes.join(',')];
      if (quote === undefined) throw new Error(`No recorded quote for basket "${codes.join(',')}".`);
      return json(quote);
    }
    return json({ error: { code: 'not_found', message: `Nothing is served at ${url}.` } }, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
