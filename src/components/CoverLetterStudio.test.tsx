import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CoverLetter, CoverLetterVersion } from "@/models";

// ── Mock database before any module that imports @/db/database loads ─────

const mockCoverLetterStore = new Map<string, CoverLetter>();

vi.mock("@/db/database", () => ({
  db: {
    coverLetters: {
      where: (field: string) => ({
        equals: (value: string) => ({
          toArray: async () => {
            if (field === "jobId") {
              return Array.from(mockCoverLetterStore.values()).filter(
                (l) => l.jobId === value,
              );
            }
            return [];
          },
        }),
      }),
      get: async (id: string) => mockCoverLetterStore.get(id) ?? undefined,
      put: async (letter: CoverLetter) => {
        mockCoverLetterStore.set(letter.id, letter);
      },
      delete: async (id: string) => {
        mockCoverLetterStore.delete(id);
      },
    },
  },
}));

// ── Import pure functions and repo (alias resolves now) ──────────────────

import {
  defaultConstraintsForMode,
  buildLetterVersion,
  buildLetterId,
} from "./CoverLetterStudio";
import { coverLetterRepo } from "@/db/repositories";

// ── defaultConstraintsForMode ────────────────────────────────────────────

describe("defaultConstraintsForMode", () => {
  it("returns 500 maxChars for tg_short", () => {
    const c = defaultConstraintsForMode("tg_short");
    expect(c.maxChars).toBe(500);
    expect(c.noEmoji).toBe(true);
    expect(c.noMarkdown).toBe(true);
    expect(c.noSpecialChars).toBe(false);
  });

  it("returns 500 maxChars for very_short", () => {
    const c = defaultConstraintsForMode("very_short");
    expect(c.maxChars).toBe(500);
  });

  it("returns 1000 maxChars for hh_standard", () => {
    const c = defaultConstraintsForMode("hh_standard");
    expect(c.maxChars).toBe(1000);
  });

  it("returns 1000 maxChars for confident", () => {
    const c = defaultConstraintsForMode("confident");
    expect(c.maxChars).toBe(1000);
  });

  it("returns 1000 maxChars for en", () => {
    const c = defaultConstraintsForMode("en");
    expect(c.maxChars).toBe(1000);
  });

  it("enables noEmoji and noMarkdown for all modes", () => {
    const modes = [
      "tg_short",
      "hh_standard",
      "confident",
      "very_short",
      "en",
    ] as const;
    for (const mode of modes) {
      const c = defaultConstraintsForMode(mode);
      expect(c.noEmoji, `noEmoji for ${mode}`).toBe(true);
      expect(c.noMarkdown, `noMarkdown for ${mode}`).toBe(true);
    }
  });
});

// ── buildLetterVersion ───────────────────────────────────────────────────

describe("buildLetterVersion", () => {
  it("creates a version with manual_edit source by default", () => {
    const version = buildLetterVersion("Hello world");
    expect(version.bodyText).toBe("Hello world");
    expect(version.source).toBe("manual_edit");
    expect(version.createdAt).toBeTruthy();
    expect(new Date(version.createdAt).getTime()).not.toBeNaN();
  });

  it("accepts custom source", () => {
    const version = buildLetterVersion("AI text", { source: "ai" });
    expect(version.source).toBe("ai");
  });

  it("generates ISO-8601 timestamps", () => {
    const version = buildLetterVersion("Test");
    expect(version.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("preserves full body text including whitespace", () => {
    const text = "  Hello  \n\nWorld  ";
    const version = buildLetterVersion(text);
    expect(version.bodyText).toBe(text);
  });
});

// ── buildLetterId ────────────────────────────────────────────────────────

describe("buildLetterId", () => {
  it("generates id with job and profile", () => {
    const id = buildLetterId("hh_123", "prof_1");
    expect(id).toMatch(/^cl_hh_123_prof_1_\d+$/);
  });

  it("generates unique IDs on subsequent calls", () => {
    const id1 = buildLetterId("hh_1", "p1");
    const id2 = buildLetterId("hh_1", "p1");
    expect(id1).toMatch(/^cl_hh_1_p1_\d+$/);
    expect(id2).toMatch(/^cl_hh_1_p1_\d+$/);
  });
});

// ── Repository tests ─────────────────────────────────────────────────────

function makeLetter(overrides?: Partial<CoverLetter>): CoverLetter {
  const now = new Date().toISOString();
  return {
    id: "cl_test_1",
    jobId: "hh_1",
    profileId: "prof_1",
    mode: "hh_standard",
    constraints: {
      noEmoji: true,
      noMarkdown: true,
      noSpecialChars: false,
      maxChars: 1000,
    },
    bodyText: "Test letter",
    isFinal: false,
    source: "manual_edit",
    versions: [
      {
        bodyText: "Test letter",
        createdAt: now,
        source: "manual_edit",
      },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("coverLetterRepo (mocked DB)", () => {
  beforeEach(() => {
    mockCoverLetterStore.clear();
  });

  it("saves and retrieves a letter by id", async () => {
    const letter = makeLetter();
    await coverLetterRepo.save(letter);

    const found = await coverLetterRepo.getById("cl_test_1");
    expect(found).toBeDefined();
    expect(found!.bodyText).toBe("Test letter");
    expect(found!.mode).toBe("hh_standard");
  });

  it("lists letters by job", async () => {
    await coverLetterRepo.save(makeLetter({ id: "cl_a", jobId: "hh_1" }));
    await coverLetterRepo.save(makeLetter({ id: "cl_b", jobId: "hh_1" }));
    await coverLetterRepo.save(makeLetter({ id: "cl_c", jobId: "hh_2" }));

    const forJob1 = await coverLetterRepo.listByJob("hh_1");
    expect(forJob1).toHaveLength(2);
    expect(forJob1.map((l) => l.id).sort()).toEqual(["cl_a", "cl_b"]);

    const forJob2 = await coverLetterRepo.listByJob("hh_2");
    expect(forJob2).toHaveLength(1);
    expect(forJob2[0].id).toBe("cl_c");
  });

  it("returns undefined for non-existent id", async () => {
    const found = await coverLetterRepo.getById("nonexistent");
    expect(found).toBeUndefined();
  });

  it("upserts — updates existing letter on second save", async () => {
    const letter = makeLetter({ bodyText: "Draft 1" });
    await coverLetterRepo.save(letter);

    const updated = { ...letter, bodyText: "Draft 2", isFinal: true };
    await coverLetterRepo.save(updated);

    const found = await coverLetterRepo.getById("cl_test_1");
    expect(found!.bodyText).toBe("Draft 2");
    expect(found!.isFinal).toBe(true);
  });

  it("deletes a letter", async () => {
    const letter = makeLetter();
    await coverLetterRepo.save(letter);
    expect(await coverLetterRepo.getById("cl_test_1")).toBeDefined();

    await coverLetterRepo.delete("cl_test_1");
    expect(await coverLetterRepo.getById("cl_test_1")).toBeUndefined();
  });

  it("handles empty job list", async () => {
    const letters = await coverLetterRepo.listByJob("hh_empty");
    expect(letters).toHaveLength(0);
  });

  it("preserves version history on save", async () => {
    const versions: CoverLetterVersion[] = [
      { bodyText: "v1", createdAt: "2025-01-01T00:00:00.000Z", source: "ai" },
      {
        bodyText: "v2",
        createdAt: "2025-01-02T00:00:00.000Z",
        source: "manual_edit",
      },
    ];

    const letter = makeLetter({ versions });
    await coverLetterRepo.save(letter);

    const found = await coverLetterRepo.getById("cl_test_1");
    expect(found!.versions).toHaveLength(2);
    expect(found!.versions[0].bodyText).toBe("v1");
    expect(found!.versions[1].bodyText).toBe("v2");
  });

  it("preserves ai metadata fields", async () => {
    const letter = makeLetter({
      source: "ai",
      aiProvider: "openai",
      aiModel: "gpt-4",
      promptVersion: "1.0.0",
    });
    await coverLetterRepo.save(letter);

    const found = await coverLetterRepo.getById("cl_test_1");
    expect(found!.source).toBe("ai");
    expect(found!.aiProvider).toBe("openai");
    expect(found!.aiModel).toBe("gpt-4");
    expect(found!.promptVersion).toBe("1.0.0");
  });
});
