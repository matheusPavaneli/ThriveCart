<?php

declare(strict_types=1);

namespace Acme\Offer;

use Acme\Catalogue\Product;
use Acme\Money;

interface Offer
{
    /** @param list<Product> $items */
    public function discountFor(array $items): Money;
}
