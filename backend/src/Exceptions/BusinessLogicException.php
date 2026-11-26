<?php

namespace Extrovent\Exceptions;

/**
 * Business logic errors (e.g., forbidden, conflict).
 */
class BusinessLogicException extends ExtroventException
{
    public function __construct(string $message, int $statusCode = 403)
    {
        parent::__construct($message, 'BUSINESS_ERROR', $statusCode);
    }
}
