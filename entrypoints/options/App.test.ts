import { describe, it, expect } from "vitest";
import type { JobStatus } from "@/models/job";

import {
  scoreColor,
  statusBadgeStyle,
  statusLabel,
  formatShortDate,
} from "./App";

// ── scoreColor ──

describe("scoreColor", () => {
  it("returns grey for undefined score", () => {
    expect(scoreColor(undefined)).toBe("#999");
  });

  it("returns green for score >= 85 (strong)", () => {
    expect(scoreColor(85)).toBe("#2a8");
    expect(scoreColor(99)).toBe("#2a8");
    expect(scoreColor(100)).toBe("#2a8");
  });

  it("returns medium green for score 70–84 (good)", () => {
    expect(scoreColor(70)).toBe("#6a6");
    expect(scoreColor(78)).toBe("#6a6");
    expect(scoreColor(84)).toBe("#6a6");
  });

  it("returns amber for score 50–69 (weak)", () => {
    expect(scoreColor(50)).toBe("#e6a817");
    expect(scoreColor(60)).toBe("#e6a817");
    expect(scoreColor(69)).toBe("#e6a817");
  });

  it("returns red for score < 50 (skip)", () => {
    expect(scoreColor(0)).toBe("#c44");
    expect(scoreColor(25)).toBe("#c44");
    expect(scoreColor(49)).toBe("#c44");
  });
});

// ── statusBadgeStyle ──

describe("statusBadgeStyle", () => {
  it("returns green-tinted style for positive statuses", () => {
    for (const s of ["applied", "interview", "offer"] as JobStatus[]) {
      const style = statusBadgeStyle(s);
      expect(style.bg).toContain("e6f7");
      expect(style.fg).toBe("#2a8");
    }
  });

  it("returns blue-tinted style for saved/letter_ready", () => {
    for (const s of ["saved", "letter_ready"] as JobStatus[]) {
      const style = statusBadgeStyle(s);
      expect(style.bg).toContain("e6f0");
      expect(style.fg).toBe("#4a90d9");
    }
  });

  it("returns red-tinted style for rejection statuses", () => {
    for (const s of [
      "rejected_by_me",
      "rejected_by_company",
      "blacklist",
    ] as JobStatus[]) {
      const style = statusBadgeStyle(s);
      expect(style.bg).toContain("fff0");
      expect(style.fg).toBe("#c44");
    }
  });

  it("returns amber-tinted style for test_task/hr_replied", () => {
    for (const s of ["test_task", "hr_replied"] as JobStatus[]) {
      const style = statusBadgeStyle(s);
      expect(style.bg).toContain("fff8");
      expect(style.fg).toBe("#e6a817");
    }
  });

  it("returns neutral grey for new/viewed", () => {
    for (const s of ["new", "viewed"] as JobStatus[]) {
      const style = statusBadgeStyle(s);
      expect(style.fg).toBe("#999");
    }
  });

  it("returns an object with bg and fg for every defined status", () => {
    const allStatuses: JobStatus[] = [
      "new",
      "viewed",
      "saved",
      "rejected_by_me",
      "letter_ready",
      "applied",
      "hr_replied",
      "interview",
      "test_task",
      "rejected_by_company",
      "offer",
      "blacklist",
    ];
    for (const s of allStatuses) {
      const style = statusBadgeStyle(s);
      expect(style).toHaveProperty("bg");
      expect(style).toHaveProperty("fg");
      expect(typeof style.bg).toBe("string");
      expect(typeof style.fg).toBe("string");
    }
  });
});

// ── statusLabel ──

describe("statusLabel", () => {
  it("returns human-readable labels for known statuses", () => {
    expect(statusLabel("new")).toBe("New");
    expect(statusLabel("viewed")).toBe("Viewed");
    expect(statusLabel("saved")).toBe("Saved");
    expect(statusLabel("rejected_by_me")).toBe("Rejected");
    expect(statusLabel("letter_ready")).toBe("Letter ready");
    expect(statusLabel("applied")).toBe("Applied");
    expect(statusLabel("hr_replied")).toBe("HR replied");
    expect(statusLabel("interview")).toBe("Interview");
    expect(statusLabel("test_task")).toBe("Test task");
    expect(statusLabel("rejected_by_company")).toBe("Rejected by co.");
    expect(statusLabel("offer")).toBe("Offer");
    expect(statusLabel("blacklist")).toBe("Blacklisted");
  });

  it("does not crash on unknown status (falls back to raw value)", () => {
    // TypeScript would normally prevent this, but defensive coding is good.
    const label = statusLabel("unknown_status" as JobStatus);
    expect(typeof label).toBe("string");
  });
});

// ── formatShortDate ──

describe("formatShortDate", () => {
  it("formats an ISO date to DD.MM.YYYY", () => {
    const iso = "2025-12-15T10:30:00.000Z";
    const formatted = formatShortDate(iso);
    expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it("returns the original string for invalid dates", () => {
    const invalid = "not-a-date";
    expect(formatShortDate(invalid)).toBe(invalid);
  });

  it("returns the original string for empty input", () => {
    expect(formatShortDate("")).toBe("");
  });

  it("produces consistent output for a known timestamp", () => {
    // 2024-03-05T12:00:00Z — use UTC-based date parts
    const iso = "2024-03-05T12:00:00.000Z";
    const result = formatShortDate(iso);
    // The day/month depend on local timezone, so just verify the pattern
    expect(result).toMatch(/^\d{2}\.\d{2}\.2024$/);
  });
});

// ── Row sorting logic (pure) ──

function sortJobsByUpdatedAtDesc<
  T extends { updatedAt: string },
>(jobs: T[]): T[] {
  return [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function makeJobStub(id: string, updatedAt: string) {
  return { id, updatedAt };
}

describe("sortJobsByUpdatedAtDesc", () => {
  it("sorts most recent first", () => {
    const jobs = [
      makeJobStub("a", "2025-01-01T00:00:00.000Z"),
      makeJobStub("b", "2025-06-01T00:00:00.000Z"),
      makeJobStub("c", "2024-12-01T00:00:00.000Z"),
    ];
    const sorted = sortJobsByUpdatedAtDesc(jobs);
    expect(sorted[0].id).toBe("b");
    expect(sorted[1].id).toBe("a");
    expect(sorted[2].id).toBe("c");
  });

  it("keeps order stable for equal timestamps", () => {
    const ts = "2025-03-01T00:00:00.000Z";
    const jobs = [
      makeJobStub("x", ts),
      makeJobStub("y", ts),
      makeJobStub("z", ts),
    ];
    const sorted = sortJobsByUpdatedAtDesc(jobs);
    expect(sorted.map((j) => j.id)).toEqual(["x", "y", "z"]);
  });

  it("handles empty array", () => {
    expect(sortJobsByUpdatedAtDesc([])).toEqual([]);
  });

  it("handles single element", () => {
    const jobs = [makeJobStub("only", "2025-01-01T00:00:00.000Z")];
    expect(sortJobsByUpdatedAtDesc(jobs)[0].id).toBe("only");
  });
});
