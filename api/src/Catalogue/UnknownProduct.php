<?php

declare(strict_types=1);

namespace Acme\Catalogue;

use DomainException;

final class UnknownProduct extends DomainException
{
    public static function withCode(string $code): self
    {
        return new self("No product with code \"{$code}\" in the catalogue.");
    }
}
