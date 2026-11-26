<?php

namespace Extrovent\Models;

/**
 * Base model with common table name mapping.
 */
abstract class BaseModel
{
    protected static string $tableName = '';
    protected static string $primaryKey = 'id';

    public static function getTableName(): string
    {
        return self::$tableName;
    }

    public static function getPrimaryKey(): string
    {
        return self::$primaryKey;
    }
}
