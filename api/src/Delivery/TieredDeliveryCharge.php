<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;
use InvalidArgumentException;

/**
 * The lowest tier whose threshold the subtotal is below sets the charge;
 * a subtotal at or above every threshold ships free.
 */
final readonly class TieredDeliveryCharge implements DeliveryChargeRule
{
    /** @var list<DeliveryTier> */
    private array $tiers;

    public function __construct(DeliveryTier ...$tiers)
    {
        $tiers = array_values($tiers);
        usort($tiers, static fn (DeliveryTier $a, DeliveryTier $b): int => $a->below->cents <=> $b->below->cents);

        foreach ($tiers as $i => $tier) {
            $previous = $tiers[$i - 1] ?? null;
            if ($previous !== null && $previous->below->cents === $tier->below->cents) {
                throw new InvalidArgumentException("Two delivery tiers share the threshold {$tier->below->format()}.");
            }
        }

        $this->tiers = $tiers;
    }

    public function chargeFor(Money $subtotal): Money
    {
        foreach ($this->tiers as $tier) {
            if ($subtotal->isLessThan($tier->below)) {
                return $tier->charge;
            }
        }

        return Money::zero();
    }
}
