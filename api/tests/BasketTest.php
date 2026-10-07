<?php

declare(strict_types=1);

namespace Acme\Tests;

use Acme\Basket;
use Acme\Catalogue\InMemoryCatalogue;
use Acme\Catalogue\Product;
use Acme\Catalogue\UnknownProduct;
use Acme\Delivery\DeliveryChargeRule;
use Acme\Money;
use Acme\Offer\Offer;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class BasketTest extends TestCase
{
    private static function catalogue(): InMemoryCatalogue
    {
        return new InMemoryCatalogue(
            new Product('A', 'Product A', new Money(1000)),
            new Product('B', 'Product B', new Money(2000)),
        );
    }

    private static function flatDelivery(int $cents): RecordingFlatDelivery
    {
        return new RecordingFlatDelivery(new Money($cents));
    }

    private static function fixedDiscount(int $cents): Offer
    {
        return new readonly class ($cents) implements Offer {
            public function __construct(private int $cents)
            {
            }

            public function discountFor(array $items): Money
            {
                return $items === [] ? Money::zero() : new Money($this->cents);
            }
        };
    }

    #[Test]
    public function the_delivery_rule_sees_the_subtotal_after_offer_discounts(): void
    {
        $delivery = self::flatDelivery(0);
        $basket = new Basket(self::catalogue(), $delivery, self::fixedDiscount(300));
        $basket->add('A');
        $basket->add('B');

        $basket->total();

        self::assertSame([2700], $delivery->seen);
    }

    #[Test]
    public function total_is_subtotal_minus_discounts_plus_delivery(): void
    {
        $basket = new Basket(self::catalogue(), self::flatDelivery(495), self::fixedDiscount(300), self::fixedDiscount(200));
        $basket->add('A');
        $basket->add('B');

        $quote = $basket->quote();

        self::assertSame(3000, $quote->subtotal->cents);
        self::assertSame(500, $quote->discount->cents);
        self::assertSame(495, $quote->delivery->cents);
        self::assertSame(2995, $quote->total->cents);
        self::assertSame(2995, $basket->total()->cents);
    }

    #[Test]
    public function an_empty_basket_totals_the_delivery_charge_for_zero(): void
    {
        $delivery = self::flatDelivery(495);
        $basket = new Basket(self::catalogue(), $delivery);

        self::assertSame(495, $basket->total()->cents);
        self::assertSame([0], $delivery->seen);
    }

    #[Test]
    public function discounts_never_take_the_basket_below_zero(): void
    {
        $basket = new Basket(self::catalogue(), self::flatDelivery(0), self::fixedDiscount(5000));
        $basket->add('A');

        self::assertSame(0, $basket->total()->cents);
    }

    #[Test]
    public function adding_an_unknown_code_throws_and_leaves_the_basket_unchanged(): void
    {
        $basket = new Basket(self::catalogue(), self::flatDelivery(0));
        $basket->add('A');

        try {
            $basket->add('NOPE');
            self::fail('Expected UnknownProduct.');
        } catch (UnknownProduct) {
        }

        self::assertSame(1000, $basket->total()->cents);
    }
}

final class RecordingFlatDelivery implements DeliveryChargeRule
{
    /** @var list<int> */
    public array $seen = [];

    public function __construct(private readonly Money $charge)
    {
    }

    public function chargeFor(Money $subtotal): Money
    {
        $this->seen[] = $subtotal->cents;

        return $this->charge;
    }
}
