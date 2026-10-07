<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;

final readonly class DeliveryTier
{
    public function __construct(
        public Money $below,
        public Money $charge,
    ) {
    }
}
