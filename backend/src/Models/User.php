<?php

namespace Extrovent\Models;

/**
 * User entity model.
 */
class User extends BaseModel
{
    protected static string $tableName = 'outdoorbuddy_users';
    protected static string $primaryKey = 'user_id';
}
