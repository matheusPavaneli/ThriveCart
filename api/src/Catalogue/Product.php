<?php

declare(strict_types=1);

namespace Acme\Catalogue;

use Acme\Money;

final readonly class Product
{
    public function __construct(
        public string $code,
        public string $name,
        public Money $price,
    ) {
    }
}
