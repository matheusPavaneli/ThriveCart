<?php

declare(strict_types=1);

namespace Acme;

/** The priced breakdown of a basket: what was bought, what came off, what delivery adds. */
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
