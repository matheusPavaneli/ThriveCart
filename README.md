# Acme Widget Co — sales basket

A proof of concept of Acme Widget Co's sales basket in PHP 8.4: products come
from a catalogue, delivery is charged by spend tier, and offers take money off.
Every rule is injected, so the basket itself knows none of Acme's prices.

## Running it

Only Docker is needed; PHP and Composer run inside the container.

```sh
docker compose run --rm php composer install
docker compose run --rm php composer test      # PHPUnit
docker compose run --rm php composer analyse   # PHPStan, level max
docker compose run --rm php php bin/basket B01 B01 R01 R01 R01
```

The CLI prints the breakdown:

```
Items:    B01, B01, R01, R01, R01
Subtotal: $114.75
Discount: -$16.48
Delivery: $0.00
Total:    $98.27
```

An unknown product code is reported on stderr with exit status 1.

## How it works

All code lives in `api/src`, under the `Acme\` namespace.

- **`Money`** — an immutable, non-negative amount in integer cents. No float is
  used anywhere, so `$32.95` is `3295` and arithmetic is exact.
- **`Catalogue\Catalogue`** — `find(code): Product`, throwing `UnknownProduct`.
  `InMemoryCatalogue` is the only implementation and rejects duplicate codes.
- **`Delivery\DeliveryChargeRule`** — a strategy: `chargeFor(subtotal): Money`.
  `TieredDeliveryCharge` takes `DeliveryTier(below, charge)` pairs in any order;
  the lowest threshold the subtotal is under sets the charge, otherwise delivery
  is free.
- **`Offer\Offer`** — a strategy: `discountFor(items): Money`.
  `BuyOneGetSecondHalfPrice` is parameterised by product code.
- **`Basket`** — built from a catalogue, a delivery rule and any number of
  offers. `add(code)` looks the product up before storing it, so a bad code
  leaves the basket untouched. `total()` returns the amount due; `quote()`
  returns the full `Quote` (subtotal, discount, delivery, total).
- **`AcmeWidgetCo`** — the composition root that wires Acme's three products,
  the $50 / $90 delivery tiers and the red widget offer. A new offer or price
  is a change here, not in `Basket`.

Pricing order in `Basket::quote()`:

1. subtotal = sum of item prices
2. discount = sum of every offer's discount (capped at the subtotal)
3. delivery = delivery rule applied to subtotal − discount
4. total = subtotal − discount + delivery

## Tests

`api/tests` mirrors `src`. Each rule is tested on its own with boundary values
(e.g. delivery at $49.99, $50.00, $89.99, $90.00), `Basket` is tested against
stub rules, and `AcmeWidgetCoTest` checks the four example baskets from the
brief:

| Products                | Total  |
| ----------------------- | ------ |
| B01, G01                | $37.85 |
| R01, R01                | $54.37 |
| R01, G01                | $60.85 |
| B01, B01, R01, R01, R01 | $98.27 |

## Assumptions

- **Half price rounds down to the cent.** The half-priced red widget costs
  `floor(3295 / 2) = 1647` cents, so the discount is `1648`. This is the only
  integer rule that yields $54.37 and $98.27; rounding half up gives $54.38 and
  $98.28.
- **Delivery is charged after offers.** R01, R01 is $65.90 before the discount
  and $49.42 after; $54.37 only works if the under-$50 tier applies, i.e. on
  the discounted amount.
- **The offer repeats per pair.** Every second red widget is half price, so
  four red widgets get two discounts. The examples only go up to three.
- **An empty basket costs $4.95.** Read literally, a $0 order is under $50.
  It could reasonably be $0 instead; that is a one-line change in
  `TieredDeliveryCharge` or `Basket`.
- **Prices are in US dollars with two decimals**, and quantities are added one
  item at a time through `add(code)`, as in the brief.
