<?php

namespace Extrovent\Exceptions;

/**
 * Authentication/authorization errors.
 */
class AuthException extends ExtroventException
{
    public function __construct(string $message = 'Authentication failed')
    {
        parent::__construct($message, 'AUTH_ERROR', 401);
    }
}
