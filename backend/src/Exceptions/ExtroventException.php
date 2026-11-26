<?php

namespace Extrovent\Exceptions;

/**
 * Base exception for all Extrovent errors.
 */
class ExtroventException extends \Exception
{
    protected string $errorCode;
    protected int $httpStatusCode;
    protected array $details = [];

    public function __construct(
        string $message,
        string $errorCode = 'GENERAL_ERROR',
        int $httpStatusCode = 500,
        array $details = []
    ) {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->httpStatusCode = $httpStatusCode;
        $this->details = $details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }

    public function getDetails(): array
    {
        return $this->details;
    }
}

