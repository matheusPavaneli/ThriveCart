<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;

/** Orders whose subtotal is below $below pay $charge for delivery. */
final readonly class DeliveryTier
{
    public function __construct(
        public Money $below,
        public Money $charge,
    ) {
    }
}
