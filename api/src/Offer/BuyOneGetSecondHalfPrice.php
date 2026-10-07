<?php

declare(strict_types=1);

namespace Acme\Offer;

use Acme\Catalogue\Product;
use Acme\Money;

/**
 * Every second item with the given code costs half its price, rounded down
 * to the cent: two pay for one and a half, four for three, and so on.
 */
final readonly class BuyOneGetSecondHalfPrice implements Offer
{
    public function __construct(private string $productCode)
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
