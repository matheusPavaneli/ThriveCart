<?php

declare(strict_types=1);

namespace Acme\Http;

use Acme\Basket;
use Acme\Catalogue\Catalogue;
use Acme\Catalogue\UnknownProduct;
use Acme\Delivery\TieredDeliveryCharge;
use Acme\Offer\BuyOneGetSecondHalfPrice;
use Acme\Offer\Offer;
use JsonException;

final readonly class HttpApi
{
    public const int MAX_ITEMS = 200;

    /** @var list<Offer> */
    private array $offers;

    public function __construct(
        private Catalogue $catalogue,
        private TieredDeliveryCharge $delivery,
        Offer ...$offers,
    ) {
        $this->offers = array_values($offers);
    }

    public function handle(string $method, string $path, string $body): Response
    {
        return match ($path) {
            '/api/catalogue' => $method === 'GET'
                ? $this->catalogue()
                : Response::error(405, 'method_not_allowed', 'Use GET for /api/catalogue.', ['Allow' => 'GET']),
            '/api/quote' => $method === 'POST'
                ? $this->quote($body)
                : Response::error(405, 'method_not_allowed', 'Use POST for /api/quote.', ['Allow' => 'POST']),
            default => Response::error(404, 'not_found', "Nothing is served at {$path}."),
        };
    }

    private function catalogue(): Response
    {
        $products = [];
        foreach ($this->catalogue->all() as $product) {
            $products[] = ['code' => $product->code, 'name' => $product->name, 'price' => $product->price->cents];
        }

        $tiers = [];
        foreach ($this->delivery->tiers as $tier) {
            $tiers[] = ['below' => $tier->below->cents, 'charge' => $tier->charge->cents];
        }

        $offers = [];
        foreach ($this->offers as $offer) {
            $offers[] = $offer instanceof BuyOneGetSecondHalfPrice
                ? ['kind' => 'second_half_price', 'productCode' => $offer->productCode]
                : ['kind' => 'other'];
        }

        return new Response(200, ['products' => $products, 'delivery' => ['tiers' => $tiers], 'offers' => $offers]);
    }

    private function quote(string $body): Response
    {
        $codes = $this->codesFrom($body);
        if ($codes instanceof Response) {
            return $codes;
        }

        $basket = new Basket($this->catalogue, $this->delivery, ...$this->offers);
        try {
            foreach ($codes as $code) {
                $basket->add($code);
            }
        } catch (UnknownProduct $e) {
            return Response::error(422, 'unknown_product', $e->getMessage());
        }

        $quote = $basket->quote();
        $next = $this->delivery->nextStep($quote->subtotal->subtract($quote->discount));

        return new Response(200, [
            'subtotal' => $quote->subtotal->cents,
            'discount' => $quote->discount->cents,
            'delivery' => $quote->delivery->cents,
            'total' => $quote->total->cents,
            'nextTier' => $next === null ? null : ['remaining' => $next->remaining->cents, 'charge' => $next->charge->cents],
        ]);
    }

    /** @return list<string>|Response */
    private function codesFrom(string $body): array|Response
    {
        try {
            $decoded = json_decode($body, true, 4, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return Response::error(400, 'invalid_body', 'The body must be JSON like {"codes": ["R01"]}.');
        }

        $codes = is_array($decoded) ? ($decoded['codes'] ?? null) : null;
        if (!is_array($codes) || !array_is_list($codes)) {
            return Response::error(400, 'invalid_body', 'The body must be JSON like {"codes": ["R01"]}.');
        }
        if (count($codes) > self::MAX_ITEMS) {
            return Response::error(413, 'too_many_items', 'A basket holds at most ' . self::MAX_ITEMS . ' items.');
        }

        $valid = [];
        foreach ($codes as $code) {
            if (!is_string($code)) {
                return Response::error(400, 'invalid_body', 'Every product code must be a string.');
            }
            $valid[] = $code;
        }

        return $valid;
    }
}
