<?php

declare(strict_types=1);

namespace Acme\Offer;

use Acme\Catalogue\Product;
use Acme\Money;

final readonly class BuyOneGetSecondHalfPrice implements Offer
{
    public function __construct(public string $productCode)
    {
    }

    public function discountFor(array $items): Money
    {
        $matching = array_values(array_filter($items, fn (Product $item): bool => $item->code === $this->productCode));
        $first = $matching[0] ?? null;
        if ($first === null) {
            return Money::zero();
        }

        $discountPerPair = $first->price->subtract($first->price->halved());

        return $discountPerPair->times(intdiv(count($matching), 2));
    }
}
