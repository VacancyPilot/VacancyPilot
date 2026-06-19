import { describe, it, expect } from "vitest";
import {
  redactEmails,
  redactPhones,
  redactUrls,
  redactTokens,
  redactContacts,
  redactText,
  truncateDescription,
} from "./redaction";

// ── redactEmails ──────────────────────────────────────────────────────

describe("redactEmails", () => {
  it("removes standard email addresses", () => {
    const input = "Contact me at john@example.com or reply.";
    const result = redactEmails(input);
    expect(result).not.toContain("john@example.com");
    expect(result).toContain("[email redacted]");
  });

  it("removes multiple email addresses", () => {
    const input = "To: alice@company.org, CC: bob@corp.ru.";
    const result = redactEmails(input);
    const redactedCount = (result.match(/\[email redacted\]/g) || []).length;
    expect(redactedCount).toBe(2);
  });

  it("removes emails with subdomains and numeric domains", () => {
    const input = "user+tag@mail.sub.domain123.com";
    const result = redactEmails(input);
    expect(result).toContain("[email redacted]");
    expect(result).not.toContain("@");
  });

  it("leaves non-email text unchanged", () => {
    const input = "No emails here, just regular text 123.";
    const result = redactEmails(input);
    expect(result).toBe(input);
  });

  it("handles empty string", () => {
    expect(redactEmails("")).toBe("");
  });
});

// ── redactPhones ──────────────────────────────────────────────────────

describe("redactPhones", () => {
  it("removes Russian +7 format", () => {
    const input = "Позвоните +7 (999) 123-45-67 в любое время.";
    const result = redactPhones(input);
    expect(result).not.toContain("999");
    expect(result).toContain("[phone redacted]");
  });

  it("removes Russian 8 format", () => {
    const input = "Тел: 8 999 123 45 67";
    const result = redactPhones(input);
    expect(result).toContain("[phone redacted]");
    expect(result).not.toMatch(/8\s*999/);
  });

  it("removes 11-digit mobile without formatting", () => {
    const input = "89991234567 — мобильный.";
    const result = redactPhones(input);
    expect(result).toContain("[phone redacted]");
    expect(result).not.toContain("89991234567");
  });

  it("removes international phone formats", () => {
    const input = "Call +1-555-123-4567 or +44 20 1234 5678.";
    const result = redactPhones(input);
    const redactedCount = (result.match(/\[phone redacted\]/g) || []).length;
    expect(redactedCount).toBeGreaterThanOrEqual(1);
  });

  it("handles text with no phone numbers", () => {
    const input = "Just some text with numbers like 42 and 1000.";
    expect(redactPhones(input)).toBe(input);
  });

  it("handles empty string", () => {
    expect(redactPhones("")).toBe("");
  });
});

// ── redactUrls ────────────────────────────────────────────────────────

describe("redactUrls", () => {
  it("removes http URLs", () => {
    const input = "Visit http://example.com for details.";
    const result = redactUrls(input);
    expect(result).toContain("[url redacted]");
    expect(result).not.toContain("http://");
  });

  it("removes https URLs", () => {
    const input = "Check https://company.ru/page?id=42.";
    const result = redactUrls(input);
    expect(result).toContain("[url redacted]");
    expect(result).not.toContain("https://");
  });

  it("handles text with no URLs", () => {
    const input = "Plain text without any links.";
    expect(redactUrls(input)).toBe(input);
  });

  it("handles empty string", () => {
    expect(redactUrls("")).toBe("");
  });
});

// ── redactTokens ──────────────────────────────────────────────────────

describe("redactTokens", () => {
  it("removes JWT-like tokens", () => {
    const input = "Auth: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYSJ9.signature_here";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
    expect(result).not.toContain("eyJ");
  });

  it("removes API key patterns like sk-...", () => {
    const input = "key=sk_4a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
  });

  it("removes hex tokens (40+ hex chars, SHA1 length and above)", () => {
    // 40 hex chars = SHA1 length
    const input = "Token: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c.";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
  });

  it("does not redact short hex (32 chars, MD5/UUID length)", () => {
    // 32 hex chars = MD5/UUID length — should NOT be redacted
    const input = "Checksum: d41d8cd98f00b204e9800998ecf8427e.";
    expect(redactTokens(input)).toBe(input);
  });

  it("removes bearer tokens", () => {
    const input = "Authorization: Bearer abc123token456xyz";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
  });

  it("removes session IDs", () => {
    const input = "session=abc123def456";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
  });

  it("removes CSRF tokens", () => {
    const input = "csrf: xyz789token";
    const result = redactTokens(input);
    expect(result).toContain("[token redacted]");
  });

  it("handles text with no token patterns", () => {
    const input = "Regular text with short hex: abc123.";
    expect(redactTokens(input)).toBe(input);
  });

  it("handles empty string", () => {
    expect(redactTokens("")).toBe("");
  });
});

// ── redactContacts ────────────────────────────────────────────────────

describe("redactContacts", () => {
  it("removes both emails and phones", () => {
    const input = "Email: hr@company.ru, Phone: +7 (999) 123-45-67.";
    const result = redactContacts(input);
    expect(result).toContain("[email redacted]");
    expect(result).toContain("[phone redacted]");
    expect(result).not.toContain("hr@company.ru");
    expect(result).not.toContain("999");
  });
});

// ── redactText (combined) ─────────────────────────────────────────────

describe("redactText", () => {
  it("applies all redaction layers", () => {
    const input =
      "Contact john@corp.com or call +7 (999) 123-45-67. " +
      "Details at https://example.com/job. " +
      "Token: eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiYSJ9.sig.";
    const result = redactText(input);

    expect(result).toContain("[email redacted]");
    expect(result).toContain("[phone redacted]");
    expect(result).toContain("[url redacted]");
    expect(result).toContain("[token redacted]");
    expect(result).not.toContain("@");
    expect(result).not.toContain("https://");
  });

  it("handles clean text (no sensitive data)", () => {
    const input = "Мы ищем React-разработчика в команду.";
    expect(redactText(input)).toBe(input);
  });

  it("handles empty string", () => {
    expect(redactText("")).toBe("");
  });
});

// ── truncateDescription ───────────────────────────────────────────────

describe("truncateDescription", () => {
  it("returns text unchanged when shorter than maxChars", () => {
    const input = "Короткое описание.";
    expect(truncateDescription(input, 500)).toBe(input);
  });

  it("truncates long text at word boundary", () => {
    const input = "один два три четыре пять шесть семь восемь девять десять";
    // Length is about 60 chars; truncate at 30
    const result = truncateDescription(input, 30);
    expect(result.length).toBeLessThanOrEqual(33); // 30 + '…' = 31 max, but we try word boundary
    expect(result).toContain("…");
    expect(input.startsWith(result.replace("…", ""))).toBe(true);
  });

  it("truncates at exact boundary when no good word break", () => {
    const input = "aaaaaaaaaabbbbbbbbbbccccccccccddddddddddeeeeeeeeee";
    const result = truncateDescription(input, 25, "...");
    expect(result.length).toBeLessThanOrEqual(28);
  });

  it("handles empty string", () => {
    expect(truncateDescription("", 100)).toBe("");
  });
});
