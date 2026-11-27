<?php
/**
 * One-shot backfill: entity INT PKs -> CHAR(36) UUIDs (db-uuid-entity-pks).
 *
 * Only needed for databases created BEFORE schema.sql switched to UUID PKs.
 * Fresh `php migrate.php --fresh` installs never need this.
 *
 * Phases (old INT columns stay until the end, so joins never break):
 *   A. Per entity table: ADD {pk}_uuid CHAR(36), fill with UUID().
 *   B. Per inbound child FK: ADD {fk}_uuid CHAR(36), backfill via join on old INT cols.
 *   C. Per outbound entity FK: ADD {fk}_uuid CHAR(36), backfill via join on old INT cols.
 *   D. Orphan check: every non-null FK must have resolved — abort if any orphans.
 *   E. Swap PKs: strip AUTO_INCREMENT, drop old INT pk, rename uuid col, re-add PK.
 *   F. Swap FK cols: drop old INT/VARCHAR col, rename uuid col (nullability preserved).
 *   G. Final verify: PK types + row counts.
 *
 * Usage: php backfill_entity_uuids.php [--db=NAME] [--dry-run]
 * Rollback: restore the pre-migration mysqldump backup.
 */

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

$args = $argv ?? [];
$dryRun = in_array('--dry-run', $args, true);
$dbOverride = null;
foreach ($args as $a) {
    if (str_starts_with($a, '--db=')) $dbOverride = substr($a, strlen('--db='));
}

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port = $_ENV['DB_PORT'] ?? '3306';
$dbname = $dbOverride ?: ($_ENV['DB_NAME'] ?? 'extrovent');
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

if (!preg_match('/^[A-Za-z0-9_]+$/', $dbname)) {
    echo "Invalid DB name\n";
    exit(1);
}

// entity => ['pk' => pkcol, 'in' => [child => fkcol], 'out' => [fkcol => parent]]
$entities = [
    'business_profile' => ['pk' => 'id', 'in' => ['place' => 'business_profile_id', 'events' => 'business_profile_id'], 'out' => []],
    'place'            => ['pk' => 'id', 'in' => ['place_image' => 'place_id', 'place_rating' => 'place_id', 'events' => 'place_id', 'posts' => 'place_id'], 'out' => ['business_profile_id' => 'business_profile']],
    'activity'         => ['pk' => 'id', 'in' => ['activity_image' => 'activity_id', 'activity_rating' => 'activity_id', 'posts' => 'activity_id'], 'out' => []],
    'chatroom'         => ['pk' => 'room_id', 'in' => ['chat_message' => 'room_id', 'chatroom_members' => 'room_id'], 'out' => []],
    'events'           => ['pk' => 'event_id', 'in' => ['event_image' => 'event_id', 'event_like' => 'event_id', 'event_comment' => 'event_id', 'event_rating' => 'event_id', 'participants' => 'event_id', 'invite' => 'event_id', 'posts' => 'event_id'], 'out' => ['place_id' => 'place', 'business_profile_id' => 'business_profile']],
    'posts'            => ['pk' => 'post_id', 'in' => ['post_image' => 'post_id', 'post_like' => 'post_id', 'post_comment' => 'post_id'], 'out' => ['place_id' => 'place', 'event_id' => 'events', 'activity_id' => 'activity']],
];

function colExists(PDO $pdo, string $table, string $col): bool
{
    $s = $pdo->prepare("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?");
    $s->execute([$table, $col]);
    return (bool) $s->fetchColumn();
}

function tableExists(PDO $pdo, string $table): bool
{
    $s = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?");
    $s->execute([$table]);
    return (bool) $s->fetchColumn();
}

function isNullable(PDO $pdo, string $table, string $col): bool
{
    $s = $pdo->prepare("SELECT IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?");
    $s->execute([$table, $col]);
    return $s->fetchColumn() === 'YES';
}

function colType(PDO $pdo, string $table, string $col): ?string
{
    $s = $pdo->prepare("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?");
    $s->execute([$table, $col]);
    $v = $s->fetchColumn();
    return $v === false ? null : (string) $v;
}

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "DB: {$dbname}@{$host}:{$port}\n";
    if ($dryRun) echo "Mode: DRY RUN\n\n";
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Skip entirely if already converted (fresh schema).
$already = true;
foreach ($entities as $t => $cfg) {
    if (!tableExists($pdo, $t)) continue;
    $type = colType($pdo, $t, $cfg['pk']);
    if ($type !== null && stripos($type, 'char(36)') === false) { $already = false; break; }
}
if ($already) {
    echo "All entity PKs are already CHAR(36) — nothing to do.\n";
    exit(0);
}

if ($dryRun) {
    echo "Would backfill UUIDs for: " . implode(', ', array_keys($entities)) . " (present tables only)\n";
    echo "Phases: A add+fill entity uuid cols, B/C backfill child+outbound fk uuid cols, D orphan check, E swap PKs, F swap FK cols, G verify.\n";
    exit(0);
}

$exec = function (string $sql) use ($pdo) {
    echo "  $sql\n";
    $pdo->exec($sql);
};

// Phase A: entity uuid cols + fill
echo "Phase A: entity UUID columns\n";
foreach ($entities as $t => $cfg) {
    if (!tableExists($pdo, $t)) { echo "  - $t missing, skipped\n"; continue; }
    if (colExists($pdo, $t, $cfg['pk'] . '_uuid')) { echo "  - $t.{$cfg['pk']}_uuid exists, skipped\n"; continue; }
    $exec("ALTER TABLE `$t` ADD COLUMN `{$cfg['pk']}_uuid` CHAR(36) NULL AFTER `{$cfg['pk']}`");
    $exec("UPDATE `$t` SET `{$cfg['pk']}_uuid` = UUID() WHERE `{$cfg['pk']}_uuid` IS NULL");
}

// Phase B: inbound child FK uuid cols + backfill
echo "Phase B: inbound FK columns\n";
foreach ($entities as $t => $cfg) {
    foreach ($cfg['in'] as $child => $fk) {
        if (!tableExists($pdo, $child)) { echo "  - $child missing, skipped\n"; continue; }
        if (!colExists($pdo, $child, $fk)) { echo "  - $child.$fk missing, skipped\n"; continue; }
        if (!colExists($pdo, $child, $fk . '_uuid')) {
            $exec("ALTER TABLE `$child` ADD COLUMN `{$fk}_uuid` CHAR(36) NULL AFTER `$fk`");
        }
        $exec("UPDATE `$child` c JOIN `$t` e ON c.`$fk` = e.`{$cfg['pk']}` SET c.`{$fk}_uuid` = e.`{$cfg['pk']}_uuid` WHERE c.`{$fk}_uuid` IS NULL");
    }
}

// Phase C: outbound entity FK uuid cols + backfill
echo "Phase C: outbound FK columns\n";
foreach ($entities as $t => $cfg) {
    foreach ($cfg['out'] as $fk => $parent) {
        if (!colExists($pdo, $t, $fk)) { echo "  - $t.$fk missing, skipped\n"; continue; }
        if (!colExists($pdo, $parent, $entities[$parent]['pk'])) { echo "  - parent $parent pk missing, skipped $t.$fk\n"; continue; }
        if (!colExists($pdo, $t, $fk . '_uuid')) {
            $exec("ALTER TABLE `$t` ADD COLUMN `{$fk}_uuid` CHAR(36) NULL AFTER `$fk`");
        }
        $pPk = $entities[$parent]['pk'];
        $exec("UPDATE `$t` c JOIN `$parent` p ON c.`$fk` = p.`$pPk` SET c.`{$fk}_uuid` = p.`{$pPk}_uuid` WHERE c.`{$fk}_uuid` IS NULL");
    }
}

// Phase D: orphan check — abort before any destructive swap
echo "Phase D: orphan check\n";
$orphans = 0;
$check = function (string $table, string $fk) use ($pdo, &$orphans) {
    if (!tableExists($pdo, $table) || !colExists($pdo, $table, $fk) || !colExists($pdo, $table, $fk . '_uuid')) return;
    $n = (int) $pdo->query("SELECT COUNT(*) FROM `$table` WHERE `$fk` IS NOT NULL AND `{$fk}_uuid` IS NULL")->fetchColumn();
    echo "  $table.$fk orphans: $n\n";
    $orphans += $n;
};
foreach ($entities as $t => $cfg) {
    foreach ($cfg['in'] as $child => $fk) $check($child, $fk);
    foreach ($cfg['out'] as $fk => $_) $check($t, $fk);
}
if ($orphans > 0) {
    echo "ABORT: $orphans orphan FK rows — resolve manually, no PKs swapped.\n";
    exit(1);
}
echo "  zero orphans — proceeding\n";

// Phase E: swap PKs
echo "Phase E: swap PKs\n";
foreach ($entities as $t => $cfg) {
    if (!tableExists($pdo, $t) || !colExists($pdo, $t, $cfg['pk'] . '_uuid')) { echo "  - $t skipped\n"; continue; }
    $pk = $cfg['pk'];
    $exec("ALTER TABLE `$t` MODIFY `$pk` INT NOT NULL");
    $exec("ALTER TABLE `$t` DROP PRIMARY KEY");
    $exec("ALTER TABLE `$t` DROP COLUMN `$pk`");
    $exec("ALTER TABLE `$t` CHANGE COLUMN `{$pk}_uuid` `$pk` CHAR(36) NOT NULL");
    $exec("ALTER TABLE `$t` ADD PRIMARY KEY (`$pk`)");
}

// Phase F: swap FK cols (nullability preserved)
echo "Phase F: swap FK columns\n";
$swapFk = function (string $table, string $fk) use ($pdo, $exec) {
    if (!tableExists($pdo, $table) || !colExists($pdo, $table, $fk . '_uuid')) return;
    $null = isNullable($pdo, $table, $fk) ? 'NULL' : 'NOT NULL';
    $exec("ALTER TABLE `$table` DROP COLUMN `$fk`");
    $exec("ALTER TABLE `$table` CHANGE COLUMN `{$fk}_uuid` `$fk` CHAR(36) $null");
};
foreach ($entities as $t => $cfg) {
    foreach ($cfg['in'] as $child => $fk) $swapFk($child, $fk);
    foreach ($cfg['out'] as $fk => $_) $swapFk($t, $fk);
}

// Phase G: final verify
echo "Phase G: verify\n";
$fail = 0;
foreach ($entities as $t => $cfg) {
    $type = colType($pdo, $t, $cfg['pk']);
    $ok = $type !== null && stripos($type, 'char(36)') !== false;
    echo "  $t.{$cfg['pk']} = $type " . ($ok ? "OK" : "FAIL") . "\n";
    if (!$ok) $fail++;
    $n = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "    rows: $n\n";
}
echo $fail === 0 ? "BACKFILL COMPLETE\n" : "BACKFILL FINISHED WITH $fail FAILURES\n";
exit($fail === 0 ? 0 : 1);
