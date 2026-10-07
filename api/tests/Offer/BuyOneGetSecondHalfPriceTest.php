<?php

declare(strict_types=1);

namespace Acme\Tests\Offer;

use Acme\Catalogue\Product;
use Acme\Money;
use Acme\Offer\BuyOneGetSecondHalfPrice;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class BuyOneGetSecondHalfPriceTest extends TestCase
{
    private static function red(): Product
    {
        return new Product('R01', 'Red Widget', new Money(3295));
    }

    /** @return iterable<string, array{int, int}> */
    public static function redWidgetCounts(): iterable
    {
        yield 'none' => [0, 0];
        yield 'one' => [1, 0];
        yield 'two' => [2, 1648];
        yield 'three' => [3, 1648];
        yield 'four' => [4, 3296];
    }

    #[Test]
    #[DataProvider('redWidgetCounts')]
    public function every_second_red_widget_is_half_price_rounded_down(int $reds, int $expectedDiscount): void
    {
        $offer = new BuyOneGetSecondHalfPrice('R01');

        self::assertSame($expectedDiscount, $offer->discountFor(array_fill(0, $reds, self::red()))->cents);
    }

    #[Test]
    public function green_and_blue_widgets_never_discount(): void
    {
        $offer = new BuyOneGetSecondHalfPrice('R01');
        $green = new Product('G01', 'Green Widget', new Money(2495));
        $blue = new Product('B01', 'Blue Widget', new Money(795));

        self::assertSame(0, $offer->discountFor([$green, $green, $blue, $blue])->cents);
    }

    #[Test]
    public function other_products_between_matching_ones_do_not_break_the_pair(): void
    {
        $offer = new BuyOneGetSecondHalfPrice('R01');
        $blue = new Product('B01', 'Blue Widget', new Money(795));

        self::assertSame(1648, $offer->discountFor([self::red(), $blue, self::red()])->cents);
    }

    #[Test]
    public function an_even_price_halves_exactly(): void
    {
        $offer = new BuyOneGetSecondHalfPrice('X01');
        $even = new Product('X01', 'Even Widget', new Money(1000));

        self::assertSame(500, $offer->discountFor([$even, $even])->cents);
    }
}
