<?php

declare(strict_types=1);

namespace Acme\Tests\Catalogue;

use Acme\Catalogue\InMemoryCatalogue;
use Acme\Catalogue\Product;
use Acme\Catalogue\UnknownProduct;
use Acme\Money;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class InMemoryCatalogueTest extends TestCase
{
    #[Test]
    public function it_finds_a_product_by_code(): void
    {
        $green = new Product('G01', 'Green Widget', new Money(2495));
        $catalogue = new InMemoryCatalogue(new Product('R01', 'Red Widget', new Money(3295)), $green);

        self::assertSame($green, $catalogue->find('G01'));
    }

    #[Test]
    public function it_lists_every_product_in_the_order_given(): void
    {
        $red = new Product('R01', 'Red Widget', new Money(3295));
        $green = new Product('G01', 'Green Widget', new Money(2495));
        $blue = new Product('B01', 'Blue Widget', new Money(795));

        self::assertSame([$red, $green, $blue], new InMemoryCatalogue($red, $green, $blue)->all());
    }

    #[Test]
    public function an_unknown_code_is_rejected(): void
    {
        $catalogue = new InMemoryCatalogue(new Product('R01', 'Red Widget', new Money(3295)));

        $this->expectException(UnknownProduct::class);
        $this->expectExceptionMessage('X99');

        $catalogue->find('X99');
    }

    #[Test]
    public function two_products_sharing_a_code_are_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new InMemoryCatalogue(
            new Product('R01', 'Red Widget', new Money(3295)),
            new Product('R01', 'Another Red Widget', new Money(100)),
        );
    }
}
