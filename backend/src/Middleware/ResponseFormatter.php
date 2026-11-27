<?php

namespace Extrovent\Middleware;

use Extrovent\Exceptions\ExtroventException;
use Extrovent\Exceptions\ValidationException;

/**
 * Response formatter middleware.
 * Formats all responses as JSON envelope: {"success": bool, "data": ..., "error": ..., "code": ..., "details": ...}
 */
class ResponseFormatter
{
    private int $statusCode = 200;
    private mixed $data = null;
    private ?string $error = null;
    private ?string $errorCode = null;
    private mixed $errorDetails = null;

    /**
     * Set success response.
     */
    public function success(mixed $data = null, int $status = 200): void
    {
        $this->statusCode = $status;
        $this->data = $data;
        $this->error = null;
    }

    /**
     * Set error response.
     */
    public function error(string $message, int $status = 400, mixed $details = null, ?string $code = null): void
    {
        $this->statusCode = $status;
        $this->data = null;
        $this->error = $message;
        $this->errorCode = $code ?? self::defaultCodeFor($status);
        $this->errorDetails = self::normalizeDetails($details);
    }

    /**
     * Handle exception and set appropriate response.
     */
    public function handleError(\Throwable $e): void
    {
        if ($e instanceof ExtroventException) {
            $this->error($e->getMessage(), $e->getHttpStatusCode(), self::exceptionDetails($e), $e->getErrorCode());
        } else {
            // Debug mode: include exception message
            if (defined('APP_DEBUG') && APP_DEBUG === true) {
                $this->error($e->getMessage(), 500, [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ], 'INTERNAL_ERROR');
            } else {
                $this->error('Internal server error', 500, null, 'INTERNAL_ERROR');
            }
        }
    }

    /**
     * Set status code.
     */
    public function setStatus(int $status): void
    {
        $this->statusCode = $status;
    }

    /**
     * Default machine-readable code for errors created without an explicit code.
     */
    private static function defaultCodeFor(int $status): string
    {
        return match (true) {
            $status === 400 => 'BAD_REQUEST',
            $status === 401 => 'UNAUTHORIZED',
            $status === 403 => 'FORBIDDEN',
            $status === 404 => 'NOT_FOUND',
            $status === 409 => 'CONFLICT',
            $status === 422 => 'VALIDATION_ERROR',
            $status === 429 => 'RATE_LIMITED',
            $status >= 500 => 'INTERNAL_ERROR',
            default => 'REQUEST_FAILED',
        };
    }

    /**
     * Normalize error details for the envelope (arrays pass through, scalars wrap, empties drop).
     */
    private static function normalizeDetails(mixed $details): mixed
    {
        if ($details === null) return null;
        if (is_array($details) && $details === []) return null;
        if (is_array($details)) return $details;
        return ['detail' => (string) $details];
    }

    /**
     * Merge exception details with validation field errors when present.
     */
    private static function exceptionDetails(\Throwable $e): mixed
    {
        $details = ($e instanceof ExtroventException) ? $e->getDetails() : [];
        if ($e instanceof ValidationException) {
            $fields = $e->getFieldErrors();
            if ($fields !== []) $details = array_merge($details, ['fields' => $fields]);
        }
        return self::normalizeDetails($details);
    }

    public function getErrorCode(): ?string
    {
        return $this->errorCode;
    }

    public function getErrorDetails(): mixed
    {
        return $this->errorDetails;
    }

    /**
     * Build and output the final JSON response.
     */
    public function send(): never
    {
        http_response_code($this->statusCode);
        header('Content-Type: application/json');

        $payload = [
            'success' => $this->error === null,
            'data' => $this->data,
            'error' => $this->error,
            'code' => $this->errorCode,
            'details' => $this->errorDetails,
        ];

        // Substitute malformed UTF-8 instead of failing the whole response:
        // legacy rows (e.g. place coordinates) may contain non-UTF8 bytes,
        // and a bare json_encode failure would emit an empty 200 body.
        $json = json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR
        );
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('ResponseFormatter: json_encode required substitution: ' . json_last_error_msg());
        }
        echo $json;
        exit;
    }

    /**
     * Get the current status code.
     */
    public function getStatus(): int
    {
        return $this->statusCode;
    }
}
