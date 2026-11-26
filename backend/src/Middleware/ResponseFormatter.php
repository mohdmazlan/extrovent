<?php

namespace Extrovent\Middleware;

use Extrovent\Exceptions\ExtroventException;

/**
 * Response formatter middleware.
 * Formats all responses as JSON envelope: {"success": bool, "data": ..., "error": ...}
 */
class ResponseFormatter
{
    private int $statusCode = 200;
    private mixed $data = null;
    private ?string $error = null;

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
    public function error(string $message, int $status = 400, mixed $details = null): void
    {
        $this->statusCode = $status;
        $this->data = null;
        $this->error = $message;

        if ($details !== null && !empty($details)) {
            // Append details to error message only if there are actual details
            $this->error .= is_array($details) ? ' (see details)' : " {$details}";
        }
    }

    /**
     * Handle exception and set appropriate response.
     */
    public function handleError(\Throwable $e): void
    {
        if ($e instanceof ExtroventException) {
            $this->error($e->getMessage(), $e->getHttpStatusCode(), $e->getDetails());
        } else {
            // Debug mode: include exception message
            if (defined('APP_DEBUG') && APP_DEBUG === true) {
                $this->error($e->getMessage(), 500, [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
            } else {
                $this->error('Internal server error', 500);
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
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE);
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
