<?php

declare(strict_types=1);

namespace Acme\Offer;

use Acme\Catalogue\Product;
use Acme\Money;

interface Offer
{
    /** @param list<Product> $items every item in the basket, in the order added */
    public function discountFor(array $items): Money;
}
