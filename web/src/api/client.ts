import type * as z from 'zod/mini';
import { type Catalogue, catalogueSchema, errorBodySchema, type Quote, quoteSchema } from './schema';

const TIMEOUT_MS = 5000;

export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    message: string,
    readonly code: string,
    readonly status: number | null,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export function asApiError(error: unknown): ApiError {
  return error instanceof ApiError ? error : new ApiError('Something went wrong talking to the basket service.', 'unexpected', null, { cause: error });
}

async function request<S extends z.ZodMiniType>(path: string, schema: S, init: RequestInit, signal?: AbortSignal): Promise<z.infer<S>> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(path, { ...init, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    throw timeout.aborted
      ? new ApiError('The basket service took too long to answer.', 'timeout', null, { cause })
      : new ApiError("The basket service isn't responding.", 'unreachable', null, { cause });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new ApiError(`The basket service sent a response that isn't JSON (status ${response.status}).`, 'invalid_response', response.status, { cause });
  }

  if (!response.ok) {
    const error = errorBodySchema.safeParse(body);
    throw error.success
      ? new ApiError(error.data.error.message, error.data.error.code, response.status)
      : new ApiError(`The basket service failed with status ${response.status}.`, 'http_error', response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError('The basket service sent a response in an unexpected shape.', 'invalid_response', response.status, { cause: parsed.error });
  }
  return parsed.data;
}

export function fetchCatalogue(signal?: AbortSignal): Promise<Catalogue> {
  return request('/api/catalogue', catalogueSchema, { method: 'GET' }, signal);
}

export function fetchQuote(codes: readonly string[], signal?: AbortSignal): Promise<Quote> {
  return request(
    '/api/quote',
    quoteSchema,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codes }) },
    signal,
  );
}
