<?php

namespace Extrovent\Config;

use Dotenv\Dotenv;

/**
 * Application configuration loader.
 * Loads .env and provides typed access to config values.
 */
class AppConfig
{
    private array $config = [];

    public function __construct(string $basePath)
    {
        // Load .env file
        $dotenv = Dotenv::createImmutable($basePath);
        $dotenv->load();

        $this->config = [
            'db' => [
                'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
                'port' => (int) ($_ENV['DB_PORT'] ?? 3306),
                'name' => $_ENV['DB_NAME'] ?? 'extrovent',
                'user' => $_ENV['DB_USER'] ?? 'root',
                'pass' => $_ENV['DB_PASS'] ?? '',
            ],
            'app' => [
                'env' => $_ENV['APP_ENV'] ?? 'development',
                'debug' => ($_ENV['APP_DEBUG'] ?? 'true') === 'true',
                'timezone' => $_ENV['APP_TIMEZONE'] ?? 'Asia/Kuala_Lumpur',
            ],
            'upload' => [
                'dir' => $_ENV['UPLOAD_DIR'] ?? __DIR__ . '/../../uploads',
                'max_size' => (int) ($_ENV['MAX_FILE_SIZE'] ?? 5242880), // 5MB
            ],
        ];
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    public function dbHost(): string
    {
        return $this->config['db']['host'];
    }

    public function dbPort(): int
    {
        return $this->config['db']['port'];
    }

    public function dbName(): string
    {
        return $this->config['db']['name'];
    }

    public function dbUser(): string
    {
        return $this->config['db']['user'];
    }

    public function dbPass(): string
    {
        return $this->config['db']['pass'];
    }

    public function uploadDir(): string
    {
        return $this->config['upload']['dir'];
    }

    public function maxFileSize(): int
    {
        return $this->config['upload']['max_size'];
    }
}
