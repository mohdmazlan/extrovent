<?php

namespace Extrovent\Exceptions;

/**
 * Validation errors.
 */
class ValidationException extends ExtroventException
{
    protected array $fieldErrors = [];

    public function __construct(string $message, array $fieldErrors = [])
    {
        parent::__construct($message, 'VALIDATION_ERROR', 400);
        $this->fieldErrors = $fieldErrors;
    }

    public function getFieldErrors(): array
    {
        return $this->fieldErrors;
    }
}
