<?php

declare(strict_types=1);

namespace Acme\Delivery;

use Acme\Money;
use InvalidArgumentException;

final readonly class TieredDeliveryCharge implements DeliveryChargeRule
{
    /** @var list<DeliveryTier> */
    public array $tiers;

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

    public function nextStep(Money $amount): ?DeliveryStep
    {
        foreach ($this->tiers as $i => $tier) {
            if ($amount->isLessThan($tier->below)) {
                $following = $this->tiers[$i + 1] ?? null;

                return new DeliveryStep(
                    remaining: $tier->below->subtract($amount),
                    charge: $following === null ? Money::zero() : $following->charge,
                );
            }
        }

        return null;
    }
}
