<?php

declare(strict_types=1);

namespace Acme\Tests;

use Acme\Money;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_cannot_be_negative(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Money(-1);
    }

    #[Test]
    public function subtracting_more_than_it_holds_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Money(100)->subtract(new Money(101));
    }

    #[Test]
    public function it_adds_subtracts_and_multiplies_in_cents(): void
    {
        self::assertSame(3290, new Money(795)->add(new Money(2495))->cents);
        self::assertSame(4942, new Money(6590)->subtract(new Money(1648))->cents);
        self::assertSame(3296, new Money(1648)->times(2)->cents);
    }

    #[Test]
    public function halving_rounds_down_to_the_cent(): void
    {
        self::assertSame(1647, new Money(3295)->halved()->cents);
        self::assertSame(1000, new Money(2000)->halved()->cents);
    }

    #[Test]
    public function it_compares_amounts(): void
    {
        self::assertTrue(new Money(4999)->isLessThan(new Money(5000)));
        self::assertFalse(new Money(5000)->isLessThan(new Money(5000)));
        self::assertSame(10, new Money(10)->min(new Money(20))->cents);
    }

    /** @return iterable<string, array{int, string}> */
    public static function formats(): iterable
    {
        yield 'zero' => [0, '$0.00'];
        yield 'cents only' => [5, '$0.05'];
        yield 'red widget' => [3295, '$32.95'];
        yield 'large' => [123456, '$1234.56'];
    }

    #[Test]
    #[DataProvider('formats')]
    public function it_formats_as_dollars(int $cents, string $expected): void
    {
        self::assertSame($expected, new Money($cents)->format());
    }
}
