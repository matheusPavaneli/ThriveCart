<?php

declare(strict_types=1);

namespace Acme;

use Acme\Catalogue\InMemoryCatalogue;
use Acme\Catalogue\Product;
use Acme\Delivery\DeliveryTier;
use Acme\Delivery\TieredDeliveryCharge;
use Acme\Http\HttpApi;
use Acme\Offer\BuyOneGetSecondHalfPrice;
use Acme\Offer\Offer;

/** The only place that knows Acme's prices, delivery tiers and offers. */
final class AcmeWidgetCo
{
    public static function basket(): Basket
    {
        return new Basket(self::catalogue(), self::delivery(), ...self::offers());
    }

    public static function httpApi(): HttpApi
    {
        return new HttpApi(self::catalogue(), self::delivery(), ...self::offers());
    }

    public static function catalogue(): InMemoryCatalogue
    {
        return new InMemoryCatalogue(
            new Product('R01', 'Red Widget', new Money(3295)),
            new Product('G01', 'Green Widget', new Money(2495)),
            new Product('B01', 'Blue Widget', new Money(795)),
        );
    }

    public static function delivery(): TieredDeliveryCharge
    {
        return new TieredDeliveryCharge(
            new DeliveryTier(below: new Money(5000), charge: new Money(495)),
            new DeliveryTier(below: new Money(9000), charge: new Money(295)),
        );
    }

    /** @return list<Offer> */
    public static function offers(): array
    {
        return [new BuyOneGetSecondHalfPrice('R01')];
    }
}
