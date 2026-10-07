<?php

declare(strict_types=1);

namespace Acme\Catalogue;

use InvalidArgumentException;

final readonly class InMemoryCatalogue implements Catalogue
{
    /** @var array<string, Product> */
    private array $products;

    public function __construct(Product ...$products)
    {
        $byCode = [];
        foreach ($products as $product) {
            if (isset($byCode[$product->code])) {
                throw new InvalidArgumentException("Duplicate product code \"{$product->code}\".");
            }
            $byCode[$product->code] = $product;
        }
        $this->products = $byCode;
    }

    public function find(string $code): Product
    {
        return $this->products[$code] ?? throw UnknownProduct::withCode($code);
    }
}
