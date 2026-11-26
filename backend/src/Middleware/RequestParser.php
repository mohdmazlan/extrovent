<?php

namespace Extrovent\Middleware;

/**
 * Request parser middleware.
 * Parses incoming requests (GET, POST, JSON body).
 */
class RequestParser
{
    private array $input;
    private array $files = [];
    private ?array $jsonBody = null;

    public function __construct()
    {
        // Merge GET and POST, POST takes precedence
        $this->input = array_merge($_GET ?? [], $_POST ?? []);

        // Parse JSON body if present (for API requests)
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            $json = file_get_contents('php://input');
            if ($json !== false) {
                $this->jsonBody = json_decode($json, true) ?? [];
                // Merge JSON body into input (JSON takes precedence)
                $this->input = array_merge($this->input, $this->jsonBody);
            }
        }

        // Parse file uploads
        $this->files = $_FILES ?? [];
    }

    /**
     * Get a value from input.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return $this->input[$key] ?? $default;
    }

    /**
     * Check if a key exists in input.
     */
    public function has(string $key): bool
    {
        return isset($this->input[$key]) && $this->input[$key] !== '';
    }

    /**
     * Get file upload.
     */
    public function getFile(string $key): ?array
    {
        return $this->files[$key] ?? null;
    }

    /**
     * Get all files.
     */
    public function getAllFiles(): array
    {
        return $this->files;
    }

    /**
     * Get JSON body (if present).
     */
    public function getJsonBody(): ?array
    {
        return $this->jsonBody;
    }

    /**
     * Get all input.
     */
    public function all(): array
    {
        return $this->input;
    }

    /**
     * Get current HTTP method.
     */
    public function method(): string
    {
        return $_SERVER['REQUEST_METHOD'] ?? 'GET';
    }

    /**
     * Get request URI path (normalized - no leading slash).
     */
    public function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        // Remove query string
        $path = parse_url($uri, PHP_URL_PATH);
        $path = $path ?: '/';
        // Remove leading slash for route matching
        return ltrim($path, '/');
    }
}
