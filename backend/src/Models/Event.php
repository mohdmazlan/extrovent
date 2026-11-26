<?php

namespace Extrovent\Models;

/**
 * Event entity model.
 */
class Event extends BaseModel
{
    protected static string $tableName = 'events';
    protected static string $primaryKey = 'event_id';
}
