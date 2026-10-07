# Acme Widget Co — sales basket

A proof of concept of Acme Widget Co's sales basket in PHP 8.4. Products come
from a catalogue, delivery is charged by spend tier, and offers take money off.
Every rule is injected, so the basket itself knows none of Acme's prices.

This repository currently holds the PHP basket. The React/TypeScript UI is
added on top of it next.

## Running it

Only Docker is needed; PHP and Composer run inside the container. From the
repository root:

```sh
docker compose run --rm php composer install
docker compose run --rm php composer test      # PHPUnit
docker compose run --rm php composer analyse   # PHPStan, level max
docker compose run --rm php php bin/basket B01 B01 R01 R01 R01
```

The CLI prices any basket and prints the breakdown:

```
Items:    B01, B01, R01, R01, R01
Subtotal: $114.75
Discount: -$16.48
Delivery: $0.00
Total:    $98.27
```

An unknown product code is reported on stderr with exit status 1.

## The basket interface

The brief leaves the format of the catalogue, delivery rules and offers open.
Here each one is an object passed to the constructor:

```php
$basket = new Basket(
    new InMemoryCatalogue(
        new Product('R01', 'Red Widget', new Money(3295)),
        new Product('G01', 'Green Widget', new Money(2495)),
        new Product('B01', 'Blue Widget', new Money(795)),
    ),
    new TieredDeliveryCharge(
        new DeliveryTier(below: new Money(5000), charge: new Money(495)),
        new DeliveryTier(below: new Money(9000), charge: new Money(295)),
    ),
    new BuyOneGetSecondHalfPrice('R01'),
);

$basket->add('R01');
$basket->add('R01');
$basket->total()->format(); // "$54.37"
```

This is exactly what `AcmeWidgetCo::basket()` builds. Amounts are integer
cents, so `new Money(3295)` is $32.95.

## How it works

```
api/
├── bin/basket                 CLI
├── src/
│   ├── Basket.php             add(), total(), quote()
│   ├── Quote.php              subtotal, discount, delivery, total
│   ├── Money.php              integer cents
│   ├── AcmeWidgetCo.php       Acme's products and rules, wired in one place
│   ├── Catalogue/             Catalogue, InMemoryCatalogue, Product, UnknownProduct
│   ├── Delivery/              DeliveryChargeRule, TieredDeliveryCharge, DeliveryTier
│   └── Offer/                 Offer, BuyOneGetSecondHalfPrice
└── tests/                     mirrors src/
```

- **`Basket`** depends on three abstractions: `Catalogue` to look products up,
  `DeliveryChargeRule` to price delivery, and any number of `Offer`s.
  `add(code)` looks the product up before storing it, so a bad code throws
  `UnknownProduct` and leaves the basket untouched. `total()` returns the amount
  due; `quote()` returns the full breakdown.
- **`TieredDeliveryCharge`** takes `DeliveryTier(below, charge)` pairs in any
  order. The lowest threshold the amount is under sets the charge; at or above
  every threshold, delivery is free.
- **`BuyOneGetSecondHalfPrice`** is parameterised by product code, so the same
  class covers the offer on any product.

`Basket::quote()` prices in this order:

1. subtotal = sum of item prices
2. discount = sum of every offer's discount, capped at the subtotal
3. delivery = delivery rule applied to subtotal − discount
4. total = subtotal − discount + delivery

## Design decisions

- **Strategies for delivery and offers.** Acme is "experimenting with special
  offers", so offers and delivery rules are interfaces. A new offer is a new
  class passed to the constructor; `Basket` does not change.
- **Integer cents, never floats.** `0.1 + 0.2` is not `0.3` in floating point.
  `Money` holds cents and refuses negative amounts, so a pricing bug fails
  loudly instead of producing a wrong total.
- **One composition root.** `AcmeWidgetCo` is the only place that knows Acme's
  prices and rules. Tests for `Basket` use stub rules; the acceptance test uses
  the real wiring.
- **No framework.** The brief is a pricing model, so the code is plain PHP with
  Composer autoloading. PHPUnit and PHPStan are the only dependencies, both for
  development.
- **Docker for the runtime.** PHP 8.4 is pinned in `api/Dockerfile`, so the
  reviewer's machine needs nothing but Docker.

## Assumptions

- **Half price rounds down to the cent.** The second red widget costs
  `floor(3295 / 2) = 1647` cents, a discount of 1648. This matches $54.37 and
  $98.27 in the brief; rounding half up would give $54.38 and $98.28.
- **Delivery is charged after offers.** R01, R01 is $65.90 before the discount
  and $49.42 after. $54.37 only works if the under-$50 tier applies, that is, on
  the discounted amount.
- **The offer repeats per pair.** Every second red widget is half price, so
  four red widgets get two discounts. The brief's examples only go up to three.
- **An empty basket costs $4.95.** Read literally, a $0 order is under $50. It
  could reasonably be $0 instead; that would be a guard in `Basket::quote()`.
- **Prices are US dollars**, and items are added one at a time through
  `add(code)`, as in the brief.

## Tests

`api/tests` mirrors `src`. Each rule is tested on its own at its boundaries
(delivery at $49.99, $50.00, $89.99 and $90.00; zero to four red widgets),
`Basket` is tested against stub rules, and `AcmeWidgetCoTest` checks the four
example baskets from the brief:

| Products                | Total  |
| ----------------------- | ------ |
| B01, G01                | $37.85 |
| R01, R01                | $54.37 |
| R01, G01                | $60.85 |
| B01, B01, R01, R01, R01 | $98.27 |

## What I would do next

- **Load the catalogue and rules from storage** behind the existing
  `Catalogue` interface, instead of wiring them in code.
- **Define how offers combine** once there is more than one: today their
  discounts add up, with no priority or exclusivity.
- **Add quantities and removal** to the basket (`add(code, qty)`, `remove`).
- **Carry a currency on `Money`** if Acme sells outside the US.
