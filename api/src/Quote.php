<?php

declare(strict_types=1);

namespace Acme;

final readonly class Quote
{
    public Money $total;

    public function __construct(
        public Money $subtotal,
        public Money $discount,
        public Money $delivery,
    ) {
        $this->total = $subtotal->subtract($discount)->add($delivery);
    }
}
