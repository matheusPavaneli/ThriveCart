<?php

declare(strict_types=1);

namespace Acme;

use Acme\Catalogue\InMemoryCatalogue;
use Acme\Catalogue\Product;
use Acme\Delivery\DeliveryTier;
use Acme\Delivery\TieredDeliveryCharge;
use Acme\Offer\BuyOneGetSecondHalfPrice;

/**
 * Composition root: Acme's products, delivery tiers and offers, wired in one
 * place. Changing a price or a rule happens here, never inside Basket.
 */
final class AcmeWidgetCo
{
    public static function basket(): Basket
    {
        return new Basket(
            new InMemoryCatalogue(
                new Product('R01', 'Red Widget', new Money(3295)),
                new Product('G01', 'Green Widget', new Money(2495)),
                new Product('B01', 'Blue Widget', new Money(795)),
            ),
            new TieredDeliveryCharge(
                new DeliveryTier(below: new Money(5000), charge: new Money(495)),
                new DeliveryTier(below: new Money(9000), charge: new Money(295)),
            ),
            new BuyOneGetSecondHalfPrice('R01'),
        );
    }
}
