<?php

declare(strict_types=1);

namespace Acme;

use Acme\Catalogue\Catalogue;
use Acme\Catalogue\Product;
use Acme\Catalogue\UnknownProduct;
use Acme\Delivery\DeliveryChargeRule;
use Acme\Offer\Offer;

final class Basket
{
    /** @var list<Product> */
    private array $items = [];

    /** @var list<Offer> */
    private readonly array $offers;

    public function __construct(
        private readonly Catalogue $catalogue,
        private readonly DeliveryChargeRule $delivery,
        Offer ...$offers,
    ) {
        $this->offers = array_values($offers);
    }

    /** @throws UnknownProduct when the code is not in the catalogue; the basket is left as it was */
    public function add(string $code): void
    {
        $this->items[] = $this->catalogue->find($code);
    }

    public function total(): Money
    {
        return $this->quote()->total;
    }

    /**
     * Offers come off first and delivery is charged on what is left, so a
     * discount can move a basket into a dearer delivery tier.
     */
    public function quote(): Quote
    {
        $subtotal = Money::zero();
        foreach ($this->items as $item) {
            $subtotal = $subtotal->add($item->price);
        }

        $discount = Money::zero();
        foreach ($this->offers as $offer) {
            $discount = $discount->add($offer->discountFor($this->items));
        }
        $discount = $discount->min($subtotal);

        return new Quote($subtotal, $discount, $this->delivery->chargeFor($subtotal->subtract($discount)));
    }
}
