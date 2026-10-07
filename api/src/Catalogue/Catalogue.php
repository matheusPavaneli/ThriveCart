<?php

declare(strict_types=1);

namespace Acme\Catalogue;

interface Catalogue
{
    /** @throws UnknownProduct */
    public function find(string $code): Product;

    /** @return list<Product> */
    public function all(): array;
}
