import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveApiKey,
  getApiKey,
  hasApiKey,
  deleteApiKey,
  deleteAllApiKeys,
  maskApiKey,
} from './api-key-bridge';

// Mock chrome.storage.local
const mockStorage = new Map<string, unknown>();

beforeEach(() => {
  mockStorage.clear();
});

vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: async (keys?: string | string[] | Record<string, unknown>) => {
        const result: Record<string, unknown> = {};
        if (typeof keys === 'string') {
          result[keys] = mockStorage.get(keys) ?? undefined;
        } else if (Array.isArray(keys)) {
          for (const key of keys) {
            result[key] = mockStorage.get(key) ?? undefined;
          }
        } else if (keys) {
          for (const key of Object.keys(keys)) {
            result[key] = mockStorage.get(key) ?? keys[key];
          }
        }
        return result;
      },
      set: async (items: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(items)) {
          mockStorage.set(key, value);
        }
      },
      remove: async (keys: string | string[]) => {
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const key of keyList) {
          mockStorage.delete(key);
        }
      },
    },
  },
});

// ── saveApiKey ────────────────────────────────────────────────────────────

describe('saveApiKey', () => {
  it('persists an API key and retrieves it', async () => {
    await saveApiKey('openai', 'sk-test-key-123');
    const key = await getApiKey('openai');
    expect(key).toBe('sk-test-key-123');
  });

  it('trims whitespace before storing', async () => {
    await saveApiKey('openai', '  sk-spaces  ');
    const key = await getApiKey('openai');
    expect(key).toBe('sk-spaces');
  });

  it('removes key when empty string is saved', async () => {
    await saveApiKey('openai', 'sk-test-key');
    await saveApiKey('openai', '');
    const key = await getApiKey('openai');
    expect(key).toBeUndefined();
  });

  it('removes key when whitespace-only string is saved', async () => {
    await saveApiKey('openai', 'sk-test-key');
    await saveApiKey('openai', '   ');
    const key = await getApiKey('openai');
    expect(key).toBeUndefined();
  });

  it('stores keys per provider without cross-contamination', async () => {
    await saveApiKey('openai', 'sk-openai');
    await saveApiKey('deepseek', 'sk-deepseek');

    expect(await getApiKey('openai')).toBe('sk-openai');
    expect(await getApiKey('deepseek')).toBe('sk-deepseek');
    expect(await getApiKey('openrouter')).toBeUndefined();
  });

  it('overwrites existing key for the same provider', async () => {
    await saveApiKey('openai', 'old-key');
    await saveApiKey('openai', 'new-key');
    expect(await getApiKey('openai')).toBe('new-key');
  });
});

// ── getApiKey ─────────────────────────────────────────────────────────────

describe('getApiKey', () => {
  it('returns undefined when no key has been saved', async () => {
    expect(await getApiKey('openai')).toBeUndefined();
  });

  it('returns undefined when storage value is not a string', async () => {
    mockStorage.set('vp_api_key_openai', 12345);
    expect(await getApiKey('openai')).toBeUndefined();
  });

  it('returns undefined for mock provider by default', async () => {
    expect(await getApiKey('mock')).toBeUndefined();
  });
});

// ── hasApiKey ─────────────────────────────────────────────────────────────

describe('hasApiKey', () => {
  it('returns false when no key is stored', async () => {
    expect(await hasApiKey('openai')).toBe(false);
  });

  it('returns true when a key is stored', async () => {
    await saveApiKey('deepseek', 'sk-deepseek-key');
    expect(await hasApiKey('deepseek')).toBe(true);
  });

  it('returns false after key is deleted', async () => {
    await saveApiKey('openai', 'sk-key');
    await deleteApiKey('openai');
    expect(await hasApiKey('openai')).toBe(false);
  });
});

// ── deleteApiKey ──────────────────────────────────────────────────────────

describe('deleteApiKey', () => {
  it('removes stored key', async () => {
    await saveApiKey('openai', 'sk-key');
    await deleteApiKey('openai');
    expect(await getApiKey('openai')).toBeUndefined();
  });

  it('is idempotent — no error when key does not exist', async () => {
    await deleteApiKey('openai'); // should not throw
    expect(await getApiKey('openai')).toBeUndefined();
  });

  it('only deletes the specified provider key', async () => {
    await saveApiKey('openai', 'sk-openai');
    await saveApiKey('deepseek', 'sk-deepseek');

    await deleteApiKey('openai');

    expect(await getApiKey('openai')).toBeUndefined();
    expect(await getApiKey('deepseek')).toBe('sk-deepseek');
  });
});

// ── deleteAllApiKeys ──────────────────────────────────────────────────────

describe('deleteAllApiKeys', () => {
  it('removes all provider keys', async () => {
    await saveApiKey('openai', 'sk-openai');
    await saveApiKey('deepseek', 'sk-deepseek');
    await saveApiKey('openrouter', 'sk-openrouter');

    await deleteAllApiKeys();

    expect(await getApiKey('openai')).toBeUndefined();
    expect(await getApiKey('deepseek')).toBeUndefined();
    expect(await getApiKey('openrouter')).toBeUndefined();
    expect(await getApiKey('mock')).toBeUndefined();
  });

  it('is safe to call when no keys exist', async () => {
    await deleteAllApiKeys(); // should not throw
    expect(await getApiKey('openai')).toBeUndefined();
  });

  it('leaves other storage keys intact', async () => {
    await saveApiKey('openai', 'sk-openai');
    mockStorage.set('app_settings_v1', { schemaVersion: 1 });

    await deleteAllApiKeys();

    expect(await getApiKey('openai')).toBeUndefined();
    expect(mockStorage.has('app_settings_v1')).toBe(true);
  });
});

// ── maskApiKey ────────────────────────────────────────────────────────────

describe('maskApiKey', () => {
  it('shows prefix and suffix for long keys', () => {
    const masked = maskApiKey('sk-abc123def456ghi789');
    expect(masked).toBe('sk-abc…i789');
    expect(masked).not.toContain('def456');
  });

  it('returns asterisks for very short keys', () => {
    const masked = maskApiKey('abc');
    expect(masked).toBe('***');
  });

  it('returns asterisks for exactly 10-char keys', () => {
    const masked = maskApiKey('1234567890');
    expect(masked).toBe('**********');
  });

  it('does not reveal the middle part', () => {
    const key = 'sk-this-is-a-secret-key-2024';
    const masked = maskApiKey(key);
    expect(masked).toBe('sk-thi…2024');
    expect(masked).not.toContain('secret');
    expect(masked).not.toContain('this-is');
  });
});
