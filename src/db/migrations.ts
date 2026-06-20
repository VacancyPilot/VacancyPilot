import { db } from "./database";
import { SCHEMA_VERSION } from "./schema";

/**
 * Migration infrastructure.
 *
 * Rules (from master spec section 10.15):
 * - Every data model change requires db.version(n).upgrade(...)
 * - Migrations must NOT delete user data without explicit backup/export
 * - Before destructive migration, warn and offer JSON export
 * - Schema version is stored in meta table
 * - Migration tests are required for v1 → latest transitions
 */

const META_KEY_VERSION = "schemaVersion";

/** Current schema version as defined in schema.ts */
export const CURRENT_VERSION = SCHEMA_VERSION;

/**
 * Read the stored schema version from the meta table.
 * Returns 0 if no version has been written yet.
 */
export async function getStoredVersion(): Promise<number> {
  const row = await db.meta.get(META_KEY_VERSION);
  return row ? (row.value as number) : 0;
}

/**
 * Write the current schema version to the meta table.
 * Call this after successful migration to record the version.
 */
export async function writeCurrentVersion(): Promise<void> {
  await db.meta.put({ key: META_KEY_VERSION, value: CURRENT_VERSION });
}

/**
 * Run any pending migrations.
 * For v1 this is a no-op (initial schema is created by version(1).stores()).
 * Future iterations will add version(n).upgrade() calls here.
 */
export async function runMigrations(): Promise<void> {
  const stored = await getStoredVersion();

  if (stored < CURRENT_VERSION) {
    // Future migrations go here:
    // if (stored < 2) { ... }
    await writeCurrentVersion();
  }
}
