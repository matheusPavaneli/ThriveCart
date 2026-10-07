<?php

declare(strict_types=1);

namespace Acme;

use InvalidArgumentException;

/**
 * A non-negative amount of dollars held in integer cents, so no float ever
 * touches a price.
 */
final readonly class Money
{
    public function __construct(public int $cents)
    {
        if ($cents < 0) {
            throw new InvalidArgumentException("Money cannot be negative, got {$cents} cents.");
        }
    }

    public static function zero(): self
    {
        return new self(0);
    }

    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function subtract(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    public function times(int $factor): self
    {
        return new self($this->cents * $factor);
    }

    /** Half of this amount, rounded down to the cent. */
    public function halved(): self
    {
        return new self(intdiv($this->cents, 2));
    }

    public function isLessThan(self $other): bool
    {
        return $this->cents < $other->cents;
    }

    public function min(self $other): self
    {
        return $this->isLessThan($other) ? $this : $other;
    }

    public function format(): string
    {
        return sprintf('$%d.%02d', intdiv($this->cents, 100), $this->cents % 100);
    }
}
