import { describe, it, expect, vi, beforeEach } from "vitest";
import { SCHEMA_VERSION } from "./schema";

/**
 * Migration tests — ITER-056.
 *
 * Cover first-run, up-to-date, and pending-version behavior
 * for the migration bookkeeping helpers.
 *
 * These tests use Vitest mocks of db.meta to exercise the
 * pure logic without needing a live IndexedDB environment.
 */

// ── Mock the database module before importing migrations ──

const metaStore = new Map<string, unknown>();

vi.mock("./database", () => ({
  db: {
    meta: {
      get: vi.fn((key: string) => {
        const value = metaStore.get(key);
        // Dexie returns { key, value } from meta table, not the raw value.
        return Promise.resolve(
          value !== undefined ? { key, value } : undefined,
        );
      }),
      put: vi.fn((entry: { key: string; value: unknown }) => {
        metaStore.set(entry.key, entry.value);
        return Promise.resolve(entry.key);
      }),
    },
  },
}));

// Dynamic import after mock setup
const {
  getStoredVersion,
  writeCurrentVersion,
  runMigrations,
  CURRENT_VERSION,
  ensureMigrationsBootstrapped,
} = await import("./migrations");

beforeEach(() => {
  metaStore.clear();
  vi.clearAllMocks();
});

describe("migration bookkeeping", () => {
  describe("getStoredVersion", () => {
    it("returns 0 when meta table is empty (first-run)", async () => {
      const version = await getStoredVersion();
      expect(version).toBe(0);
    });

    it("returns the stored version after writeCurrentVersion", async () => {
      await writeCurrentVersion();
      const version = await getStoredVersion();
      expect(version).toBe(CURRENT_VERSION);
    });

    it("returns 0 when meta entry exists but value is 0", async () => {
      metaStore.set("schemaVersion", 0);
      const version = await getStoredVersion();
      expect(version).toBe(0);
    });
  });

  describe("writeCurrentVersion", () => {
    it("writes CURRENT_VERSION to meta table", async () => {
      await writeCurrentVersion();
      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });

    it("overwrites a previous version", async () => {
      metaStore.set("schemaVersion", 2);
      await writeCurrentVersion();
      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });
  });

  describe("runMigrations", () => {
    it("first-run: writes CURRENT_VERSION when stored version is 0", async () => {
      await runMigrations();
      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });

    it("up-to-date: no-op when stored version equals CURRENT_VERSION", async () => {
      metaStore.set("schemaVersion", CURRENT_VERSION);
      await runMigrations();
      // Version should still be CURRENT_VERSION — no change
      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });

    it("pending-version: writes CURRENT_VERSION when stored version is lower", async () => {
      metaStore.set("schemaVersion", 2);
      await runMigrations();
      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });

    it("does not downgrade when stored version is higher (corrupted meta guard)", async () => {
      metaStore.set("schemaVersion", 99);
      await runMigrations();
      // Must not overwrite — stored > current means something unexpected
      expect(metaStore.get("schemaVersion")).toBe(99);
    });
  });

  describe("CURRENT_VERSION alignment", () => {
    it("matches SCHEMA_VERSION", () => {
      expect(CURRENT_VERSION).toBe(SCHEMA_VERSION);
    });

    it("is a positive integer", () => {
      expect(CURRENT_VERSION).toBeGreaterThan(0);
      expect(Number.isInteger(CURRENT_VERSION)).toBe(true);
    });
  });

  describe("ensureMigrationsBootstrapped", () => {
    it("runs migration bookkeeping only once across repeated calls", async () => {
      const first = ensureMigrationsBootstrapped();
      const second = ensureMigrationsBootstrapped();

      await Promise.all([first, second]);

      expect(metaStore.get("schemaVersion")).toBe(CURRENT_VERSION);
    });
  });
});
