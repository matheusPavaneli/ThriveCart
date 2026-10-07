<?php

declare(strict_types=1);

namespace Acme\Catalogue;

interface Catalogue
{
    /** @throws UnknownProduct when no product has this code */
    public function find(string $code): Product;
}
