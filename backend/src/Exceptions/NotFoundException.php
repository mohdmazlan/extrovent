<?php

namespace Extrovent\Exceptions;

/**
 * Resource not found.
 */
class NotFoundException extends ExtroventException
{
    public function __construct(string $message = 'Resource not found')
    {
        parent::__construct($message, 'NOT_FOUND', 404);
    }
}
