<?php

declare(strict_types=1);

namespace Acme\Tests\Delivery;

use Acme\Delivery\DeliveryTier;
use Acme\Delivery\TieredDeliveryCharge;
use Acme\Money;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class TieredDeliveryChargeTest extends TestCase
{
    /** @return iterable<string, array{int, int}> */
    public static function boundaries(): iterable
    {
        yield 'empty basket' => [0, 495];
        yield 'just under $50' => [4999, 495];
        yield 'exactly $50' => [5000, 295];
        yield 'just under $90' => [8999, 295];
        yield 'exactly $90' => [9000, 0];
        yield 'well over $90' => [20000, 0];
    }

    #[Test]
    #[DataProvider('boundaries')]
    public function it_charges_by_the_first_threshold_the_subtotal_is_below(int $subtotal, int $expected): void
    {
        $rule = new TieredDeliveryCharge(
            new DeliveryTier(new Money(5000), new Money(495)),
            new DeliveryTier(new Money(9000), new Money(295)),
        );

        self::assertSame($expected, $rule->chargeFor(new Money($subtotal))->cents);
    }

    #[Test]
    public function tiers_given_out_of_order_behave_the_same(): void
    {
        $rule = new TieredDeliveryCharge(
            new DeliveryTier(new Money(9000), new Money(295)),
            new DeliveryTier(new Money(5000), new Money(495)),
        );

        self::assertSame(495, $rule->chargeFor(new Money(4999))->cents);
        self::assertSame(295, $rule->chargeFor(new Money(5000))->cents);
    }

    #[Test]
    public function no_tiers_means_free_delivery(): void
    {
        self::assertSame(0, new TieredDeliveryCharge()->chargeFor(new Money(0))->cents);
    }

    #[Test]
    public function two_tiers_with_the_same_threshold_are_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new TieredDeliveryCharge(
            new DeliveryTier(new Money(5000), new Money(495)),
            new DeliveryTier(new Money(5000), new Money(295)),
        );
    }
}
