<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;

final readonly class DeliveryStep
{
    public function __construct(
        public Money $remaining,
        public Money $charge,
    ) {
    }
}
