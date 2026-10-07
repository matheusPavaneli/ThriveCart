import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { type ApiError, asApiError, fetchCatalogue } from './api/client';
import type { Catalogue } from './api/schema';
import { basketReducer, linesOf } from './basket/basket';
import { intensitiesOf, mixOf } from './basket/mix';
import { useQuote } from './basket/useQuote';
import { BasketBar } from './components/BasketBar';
import { BasketScreen, pricesFailed } from './components/BasketScreen';
import { ErrorState } from './components/ErrorState';
import { ExampleBaskets } from './components/ExampleBaskets';
import { LiveRegion } from './components/LiveRegion';
import { ProductList } from './components/ProductList';
import { formatCents } from './format';
import { useMediaQuery } from './hooks/useMediaQuery';

const BasketSheet = lazy(() => import('./components/BasketSheet'));

type CatalogueState = { status: 'loading' } | { status: 'ready'; catalogue: Catalogue } | { status: 'failed'; error: ApiError };

function useCatalogue() {
  const [state, setState] = useState<CatalogueState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchCatalogue(controller.signal).then(
      (catalogue) => setState({ status: 'ready', catalogue }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'failed', error: asApiError(error) });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  return { state, retry: useCallback(() => setAttempt((n) => n + 1), []) };
}

function Wordmark() {
  return (
    <p className="flex items-center gap-2.5 text-base font-semibold">
      <span aria-hidden="true" className="flex -space-x-1">
        <span className="size-3 rounded-pill bg-red-ink" />
        <span className="size-3 rounded-pill bg-green-ink" />
        <span className="size-3 rounded-pill bg-blue-ink" />
      </span>
      Acme Widget Co
    </p>
  );
}

function ProductsPlaceholder() {
  return (
    <ul aria-hidden="true" className="grid gap-x-8 gap-y-6 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="grid grid-cols-[56px_1fr] items-center gap-4 lg:grid-cols-1 lg:gap-y-5">
          <div className="aspect-square w-14 rounded-pill bg-ink/5 lg:w-full lg:max-w-[168px]" />
          <div className="grid gap-2">
            <div className="h-5 w-32 rounded-control bg-ink/5" />
            <div className="h-4 w-20 rounded-control bg-ink/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const catalogue = useCatalogue();
  const [codes, dispatch] = useReducer(basketReducer, []);
  const { state: quoteState, retry: retryQuote } = useQuote(codes);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const pendingAnnouncement = useRef<string | null>(null);
  const basketBar = useRef<HTMLButtonElement>(null);

  const products = catalogue.state.status === 'ready' ? catalogue.state.catalogue.products : [];
  const nameOf = useCallback((code: string) => products.find((p) => p.code === code)?.name ?? code, [products]);

  const lines = useMemo(() => linesOf(codes).map((line) => ({ ...line, name: nameOf(line.code) })), [codes, nameOf]);
  const counts = useMemo(() => new Map(lines.map((l) => [l.code, l.count])), [lines]);
  const intensities = useMemo(() => intensitiesOf(codes), [codes]);
  const mix = mixOf(intensities);

  const offers = catalogue.state.status === 'ready' ? catalogue.state.catalogue.offers : [];
  const halfPriceCodes = useMemo(
    () => new Set(offers.flatMap((o) => (o.kind === 'second_half_price' && o.productCode ? [o.productCode] : []))),
    [offers],
  );
  const singleOfferCode = offers.length === 1 ? offers[0]?.productCode : undefined;
  const offerLabel = singleOfferCode ? `${nameOf(singleOfferCode)} offer` : 'Offers';

  useEffect(() => {
    if (quoteState.status === 'ready' && pendingAnnouncement.current) {
      setAnnouncement(`${pendingAnnouncement.current} Total ${formatCents(quoteState.quote.total)}.`);
      pendingAnnouncement.current = null;
    }
  }, [quoteState]);

  const add = useCallback(
    (code: string) => {
      pendingAnnouncement.current = `Added ${nameOf(code)}.`;
      dispatch({ type: 'add', code });
    },
    [nameOf],
  );
  const remove = useCallback(
    (code: string) => {
      pendingAnnouncement.current = `Removed ${nameOf(code)}.`;
      dispatch({ type: 'remove', code });
    },
    [nameOf],
  );
  const pick = useCallback((example: readonly string[]) => {
    pendingAnnouncement.current = 'Loaded example basket.';
    dispatch({ type: 'replace', codes: example });
  }, []);

  const tiers = catalogue.state.status === 'ready' ? catalogue.state.catalogue.delivery.tiers : [];
  const screenProps = {
    lines,
    itemCount: codes.length,
    intensities,
    mix,
    quoteState,
    tiers,
    offerLabel,
    onAdd: add,
    onRemove: remove,
    onRetry: retryQuote,
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-32 sm:px-8 lg:pb-16">
      <header className="py-6">
        <Wordmark />
      </header>

      <main className="grid gap-12 pt-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:pt-12">
        <div className="grid content-start gap-12 lg:gap-16">
          <div className="grid gap-4">
            <h1 className="display text-2xl sm:text-3xl">Pick your widgets</h1>
            <p className="max-w-[44ch] text-lg text-balance text-slate">
              Delivery gets cheaper as you spend. Every second red widget is half price.
            </p>
          </div>

          <section aria-label="Widgets">
            {catalogue.state.status === 'ready' ? (
              <ProductList products={products} counts={counts} halfPriceCodes={halfPriceCodes} onAdd={add} />
            ) : catalogue.state.status === 'failed' ? (
              <ErrorState message={pricesFailed(catalogue.state.error)} onRetry={catalogue.retry} />
            ) : (
              <ProductsPlaceholder />
            )}
          </section>

          {catalogue.state.status === 'ready' && (
            <ExampleBaskets codes={codes} quoteState={quoteState} nameOf={nameOf} onPick={pick} />
          )}
        </div>

        {isDesktop && (
          <aside className="self-start lg:sticky lg:top-8">
            <BasketScreen {...screenProps} />
          </aside>
        )}
      </main>

      {!isDesktop && (
        <>
          <BasketBar
            ref={basketBar}
            itemCount={codes.length}
            mix={mix}
            quoteState={quoteState}
            onOpen={() => {
              setSheetLoaded(true);
              setSheetOpen(true);
            }}
          />
          {sheetLoaded && (
            <Suspense fallback={null}>
              <BasketSheet
                {...screenProps}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                returnFocus={() => basketBar.current?.focus()}
              />
            </Suspense>
          )}
        </>
      )}

      <LiveRegion message={announcement} />
    </div>
  );
}
