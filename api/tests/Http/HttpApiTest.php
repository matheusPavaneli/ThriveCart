<?php

declare(strict_types=1);

namespace Acme\Tests\Http;

use Acme\AcmeWidgetCo;
use Acme\Http\HttpApi;
use Acme\Http\Response;
use Acme\Money;
use Acme\Offer\Offer;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class HttpApiTest extends TestCase
{
    private static function api(): HttpApi
    {
        return AcmeWidgetCo::httpApi();
    }

    /** @param list<mixed> $codes */
    private static function quote(array $codes): Response
    {
        return self::api()->handle('POST', '/api/quote', json_encode(['codes' => $codes], JSON_THROW_ON_ERROR));
    }

    /** @return array<mixed> */
    private static function error(Response $response): array
    {
        $error = $response->body['error'] ?? null;
        self::assertIsArray($error);

        return $error;
    }

    #[Test]
    public function the_catalogue_lists_products_tiers_and_offers_in_cents(): void
    {
        $response = self::api()->handle('GET', '/api/catalogue', '');

        self::assertSame(200, $response->status);
        self::assertSame([
            'products' => [
                ['code' => 'R01', 'name' => 'Red Widget', 'price' => 3295],
                ['code' => 'G01', 'name' => 'Green Widget', 'price' => 2495],
                ['code' => 'B01', 'name' => 'Blue Widget', 'price' => 795],
            ],
            'delivery' => ['tiers' => [
                ['below' => 5000, 'charge' => 495],
                ['below' => 9000, 'charge' => 295],
            ]],
            'offers' => [['kind' => 'second_half_price', 'productCode' => 'R01']],
        ], $response->body);
    }

    #[Test]
    public function any_offer_can_be_served_and_is_listed_by_kind(): void
    {
        $flatDollarOff = new readonly class implements Offer {
            public function discountFor(array $items): Money
            {
                return $items === [] ? Money::zero() : new Money(100);
            }
        };
        $api = new HttpApi(AcmeWidgetCo::catalogue(), AcmeWidgetCo::delivery(), $flatDollarOff);

        $catalogue = $api->handle('GET', '/api/catalogue', '');
        $quote = $api->handle('POST', '/api/quote', '{"codes": ["B01"]}');

        self::assertSame([['kind' => 'other']], $catalogue->body['offers']);
        self::assertSame(100, $quote->body['discount']);
        self::assertSame(795 - 100 + 495, $quote->body['total']);
    }

    /** @return iterable<string, array{list<string>, int}> */
    public static function exampleBaskets(): iterable
    {
        yield 'B01, G01' => [['B01', 'G01'], 3785];
        yield 'R01, R01' => [['R01', 'R01'], 5437];
        yield 'R01, G01' => [['R01', 'G01'], 6085];
        yield 'B01, B01, R01, R01, R01' => [['B01', 'B01', 'R01', 'R01', 'R01'], 9827];
    }

    /** @param list<string> $codes */
    #[Test]
    #[DataProvider('exampleBaskets')]
    public function it_prices_the_example_baskets(array $codes, int $total): void
    {
        $response = self::quote($codes);

        self::assertSame(200, $response->status);
        self::assertSame($total, $response->body['total']);
    }

    #[Test]
    public function a_quote_breaks_the_total_down_and_says_how_far_the_next_tier_is(): void
    {
        self::assertSame([
            'subtotal' => 6590,
            'discount' => 1648,
            'delivery' => 495,
            'total' => 5437,
            'nextTier' => ['remaining' => 58, 'charge' => 295],
        ], self::quote(['R01', 'R01'])->body);
    }

    #[Test]
    public function a_basket_with_free_delivery_has_no_next_tier(): void
    {
        self::assertNull(self::quote(['B01', 'B01', 'R01', 'R01', 'R01'])->body['nextTier']);
    }

    #[Test]
    public function an_empty_basket_is_priced(): void
    {
        $response = self::quote([]);

        self::assertSame(200, $response->status);
        self::assertSame(495, $response->body['total']);
    }

    /** @return iterable<string, array{string}> */
    public static function invalidBodies(): iterable
    {
        yield 'not JSON' => ['{codes:'];
        yield 'empty' => [''];
        yield 'a JSON list' => ['["R01"]'];
        yield 'no codes field' => ['{"items": ["R01"]}'];
        yield 'codes is a string' => ['{"codes": "R01"}'];
        yield 'codes is an object' => ['{"codes": {"a": "R01"}}'];
        yield 'a code is a number' => ['{"codes": ["R01", 1]}'];
        yield 'nested too deep' => ['{"codes": [[[["R01"]]]]}'];
    }

    #[Test]
    #[DataProvider('invalidBodies')]
    public function a_malformed_body_is_rejected(string $body): void
    {
        $response = self::api()->handle('POST', '/api/quote', $body);

        self::assertSame(400, $response->status);
        self::assertSame('invalid_body', self::error($response)['code']);
    }

    #[Test]
    public function an_unknown_product_is_rejected_by_name(): void
    {
        $response = self::quote(['R01', 'X99']);

        self::assertSame(422, $response->status);
        self::assertSame('unknown_product', self::error($response)['code']);
        self::assertIsString(self::error($response)['message']);
        self::assertStringContainsString('X99', self::error($response)['message']);
    }

    #[Test]
    public function a_basket_over_the_item_limit_is_rejected(): void
    {
        self::assertSame(200, self::quote(array_fill(0, HttpApi::MAX_ITEMS, 'B01'))->status);

        $response = self::quote(array_fill(0, HttpApi::MAX_ITEMS + 1, 'B01'));

        self::assertSame(413, $response->status);
        self::assertSame('too_many_items', self::error($response)['code']);
    }

    #[Test]
    public function an_unknown_path_is_not_found(): void
    {
        $response = self::api()->handle('GET', '/api/nope', '');

        self::assertSame(404, $response->status);
        self::assertSame('not_found', self::error($response)['code']);
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function wrongMethods(): iterable
    {
        yield 'GET a quote' => ['GET', '/api/quote', 'POST'];
        yield 'POST the catalogue' => ['POST', '/api/catalogue', 'GET'];
    }

    #[Test]
    #[DataProvider('wrongMethods')]
    public function a_wrong_method_is_rejected_with_the_allowed_one(string $method, string $path, string $allow): void
    {
        $response = self::api()->handle($method, $path, '');

        self::assertSame(405, $response->status);
        self::assertSame('method_not_allowed', self::error($response)['code']);
        self::assertSame(['Allow' => $allow], $response->headers);
    }

    #[Test]
    public function responses_encode_as_json(): void
    {
        self::assertSame('{"error":{"code":"x","message":"y"}}', Response::error(400, 'x', 'y')->json());
    }
}
