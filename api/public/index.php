<?php

declare(strict_types=1);

use Acme\AcmeWidgetCo;
use Acme\Http\Response;

require dirname(__DIR__) . '/vendor/autoload.php';

const MAX_BODY_BYTES = 8192;

$method = is_string($_SERVER['REQUEST_METHOD'] ?? null) ? $_SERVER['REQUEST_METHOD'] : 'GET';
$uri = is_string($_SERVER['REQUEST_URI'] ?? null) ? $_SERVER['REQUEST_URI'] : '/';
$path = parse_url($uri, PHP_URL_PATH);

// One byte past the cap detects an oversized body without buffering all of it.
$body = file_get_contents('php://input', length: MAX_BODY_BYTES + 1);

$response = match (true) {
    $body === false => Response::error(400, 'invalid_body', 'The request body could not be read.'),
    strlen($body) > MAX_BODY_BYTES => Response::error(413, 'payload_too_large', 'The body is larger than 8 KB.'),
    default => null,
};

if ($response === null) {
    try {
        $response = AcmeWidgetCo::httpApi()->handle($method, is_string($path) ? $path : '/', $body);
    } catch (Throwable $e) {
        error_log((string) $e);
        $response = Response::error(500, 'internal_error', 'The basket service failed to price this request.');
    }
}

http_response_code($response->status);
header('Content-Type: application/json');
foreach ($response->headers as $name => $value) {
    header("{$name}: {$value}");
}
echo $response->json();
