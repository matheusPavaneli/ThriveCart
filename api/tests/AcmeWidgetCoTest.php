<?php

declare(strict_types=1);

namespace Acme\Tests;

use Acme\AcmeWidgetCo;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class AcmeWidgetCoTest extends TestCase
{
    /** @return iterable<string, array{list<string>, string}> The example baskets from the brief. */
    public static function exampleBaskets(): iterable
    {
        yield 'B01, G01' => [['B01', 'G01'], '$37.85'];
        yield 'R01, R01' => [['R01', 'R01'], '$54.37'];
        yield 'R01, G01' => [['R01', 'G01'], '$60.85'];
        yield 'B01, B01, R01, R01, R01' => [['B01', 'B01', 'R01', 'R01', 'R01'], '$98.27'];
    }

    /** @param list<string> $codes */
    #[Test]
    #[DataProvider('exampleBaskets')]
    public function it_prices_the_example_baskets(array $codes, string $expected): void
    {
        $basket = AcmeWidgetCo::basket();
        foreach ($codes as $code) {
            $basket->add($code);
        }

        self::assertSame($expected, $basket->total()->format());
    }
}
