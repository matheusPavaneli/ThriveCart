<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;

interface DeliveryChargeRule
{
    public function chargeFor(Money $subtotal): Money;
}
