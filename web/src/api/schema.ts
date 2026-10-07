import * as z from 'zod/mini';

const cents = z.int().check(z.minimum(0));

export const catalogueSchema = z.object({
  products: z.array(z.object({ code: z.string(), name: z.string(), price: cents })),
  delivery: z.object({ tiers: z.array(z.object({ below: cents, charge: cents })) }),
  offers: z.array(z.object({ kind: z.string(), productCode: z.optional(z.string()) })),
});

export const quoteSchema = z.object({
  subtotal: cents,
  discount: cents,
  delivery: cents,
  total: cents,
  nextTier: z.nullable(z.object({ remaining: cents, charge: cents })),
});

export const errorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

export type Catalogue = z.infer<typeof catalogueSchema>;
export type Product = Catalogue['products'][number];
export type Quote = z.infer<typeof quoteSchema>;
