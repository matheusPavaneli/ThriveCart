<?php

declare(strict_types=1);

namespace Acme\Http;

final readonly class Response
{
    /**
     * @param array<string, mixed> $body
     * @param array<string, string> $headers
     */
    public function __construct(
        public int $status,
        public array $body,
        public array $headers = [],
    ) {
    }

    /** @param array<string, string> $headers */
    public static function error(int $status, string $code, string $message, array $headers = []): self
    {
        return new self($status, ['error' => ['code' => $code, 'message' => $message]], $headers);
    }

    public function json(): string
    {
        return json_encode($this->body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }
}
