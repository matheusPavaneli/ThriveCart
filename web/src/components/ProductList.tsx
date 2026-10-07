import { Plus } from 'lucide-react';
import type { Product } from '../api/schema';
import { formatCents } from '../format';
import { channelOf, ink } from '../products';
import { WidgetLens } from './WidgetLens';

interface ProductListProps {
  products: readonly Product[];
  counts: ReadonlyMap<string, number>;
  halfPriceCodes: ReadonlySet<string>;
  onAdd: (code: string) => void;
}

function offerCopy(name: string, count: number): string {
  return count % 2 === 1 ? `Add another ${name.toLowerCase()} and it's half price` : 'Every second one half price';
}

export function ProductList({ products, counts, halfPriceCodes, onAdd }: ProductListProps) {
  return (
    <ul className="grid gap-x-8 gap-y-6 lg:grid-cols-3 lg:gap-y-0">
      {products.map((product) => {
        const channel = channelOf(product.code);
        const count = counts.get(product.code) ?? 0;
        return (
          <li key={product.code} className="grid grid-cols-[56px_1fr_auto] items-center gap-x-4 lg:grid-cols-1 lg:content-start lg:items-start lg:gap-y-5">
            {channel ? (
              <WidgetLens channel={channel} count={count} className="w-14 lg:w-full lg:max-w-[168px]" />
            ) : (
              <div aria-hidden="true" className="aspect-square w-14 rounded-pill bg-slate/20 lg:w-full lg:max-w-[168px]" />
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-semibold leading-tight">{product.name}</h3>
              <p className="figures mt-1 text-base">{formatCents(product.price)}</p>
              <p className="figures text-sm text-slate">Code {product.code}</p>
            </div>
            <button
              type="button"
              onClick={() => onAdd(product.code)}
              aria-label={`Add ${product.name}`}
              className={`button-press inline-flex items-center gap-2 justify-self-start rounded-pill px-4 py-2.5 text-base font-medium text-white hover:opacity-90 ${channel ? ink[channel] : 'bg-ink'}`}
            >
              <Plus aria-hidden="true" size={18} strokeWidth={2.25} />
              <span>Add</span>
            </button>
            {halfPriceCodes.has(product.code) && (
              <p className="col-start-2 col-span-2 mt-2 text-sm font-medium text-slate lg:order-last lg:col-span-1 lg:col-start-1 lg:-mt-2">
                {offerCopy(product.name, count)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
