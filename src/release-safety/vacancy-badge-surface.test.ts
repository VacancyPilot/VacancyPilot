import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const vacancyContentPath = join(
  __dirname,
  "..",
  "..",
  "entrypoints",
  "vacancy.content.ts",
);

function readVacancyContentSource(): string {
  return readFileSync(vacancyContentPath, "utf-8");
}

describe("vacancy badge accessibility and placement", () => {
  const source = readVacancyContentSource();

  it("positions the badge below the HH header instead of the top edge", () => {
    expect(source).toContain("top:56px;right:16px");
  });

  it("marks the badge as a keyboard-focusable button", () => {
    expect(source).toContain('setAttribute("role", "button")');
    expect(source).toContain('setAttribute("tabindex", "0")');
    expect(source).toContain(
      'setAttribute("aria-label", "Open VacancyPilot side panel")',
    );
  });

  it("supports keyboard activation with Enter and Space", () => {
    expect(source).toContain('container.addEventListener("keydown"');
    expect(source).toContain('event.key === "Enter"');
    expect(source).toContain('event.key === " "');
  });
});
