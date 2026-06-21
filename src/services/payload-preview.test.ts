import { describe, it, expect } from "vitest";
import type { VacancyAnalysisInput, CoverLetterInput } from "@/models/ai";
import {
  generateVacancyAnalysisPreview,
  generateCoverLetterPreview,
} from "./payload-preview";

// ── Vacancy Analysis preview ──────────────────────────────────────────

describe("generateVacancyAnalysisPreview", () => {
  function makeInput(
    overrides?: Partial<VacancyAnalysisInput>,
    strict = false,
  ): VacancyAnalysisInput {
    return {
      job: {
        title: "Senior Frontend Developer",
        company: "Acme Corp",
        salaryRaw: "200 000 – 300 000 ₽",
        city: "Москва",
        workMode: "remote",
        experienceRaw: "3–6 лет",
        skills: ["React", "TypeScript", "Node.js"],
        descriptionClean:
          "Мы ищем опытного разработчика со знанием React и TypeScript.",
      },
      profile: {
        summary: "Frontend-разработчик с 5-летним опытом.",
        targetTitles: ["Frontend Developer"],
        mustHaveSkills: ["React", "TypeScript"],
        niceToHaveSkills: ["Node.js"],
      },
      resumeHighlights: "5 лет React; лидировал команду.",
      strictPrivacy: strict,
      ...overrides,
    };
  }

  it('returns mode "standard" when strictPrivacy is false', () => {
    const input = makeInput(undefined, false);
    const preview = generateVacancyAnalysisPreview(input);

    expect(preview.mode).toBe("standard");
    expect(preview.estimatedTokens).toBeGreaterThan(0);
  });

  it('returns mode "strict" when strictPrivacy is true', () => {
    const input = makeInput(undefined, true);
    const preview = generateVacancyAnalysisPreview(input);

    expect(preview.mode).toBe("strict");
    expect(preview.estimatedTokens).toBeGreaterThan(0);
  });

  it("includes all standard fields in preview", () => {
    const input = makeInput();
    const preview = generateVacancyAnalysisPreview(input);

    const labels = preview.includedFields.map((f) => f.label);
    expect(labels).toContain("Название вакансии");
    expect(labels).toContain("Компания");
    expect(labels).toContain("Зарплата");
    expect(labels).toContain("Город");
    expect(labels).toContain("Формат работы");
    expect(labels).toContain("Опыт");
    expect(labels).toContain("Навыки");
    expect(labels).toContain("Описание вакансии");
    expect(labels).toContain("Резюме — highlights");
  });

  it("excludes descriptionClean when it is empty", () => {
    const input = makeInput({
      job: {
        title: "Dev",
        company: "Corp",
        workMode: "office",
        skills: [],
        descriptionClean: "",
      },
    });
    const preview = generateVacancyAnalysisPreview(input);

    const excludedLabels = preview.excludedFields;
    expect(excludedLabels).toContain("Описание вакансии");
  });

  it("excludes resumeHighlights when undefined", () => {
    const input = makeInput({ resumeHighlights: undefined });
    const preview = generateVacancyAnalysisPreview(input);

    const excludedLabels = preview.excludedFields;
    expect(excludedLabels).toContain("Резюме — highlights");
  });

  it("excludes resumeHighlights when empty string", () => {
    const input = makeInput({ resumeHighlights: "" });
    const preview = generateVacancyAnalysisPreview(input);

    expect(preview.excludedFields).toContain("Резюме — highlights");
  });

  it("lists static exclusions", () => {
    const input = makeInput();
    const preview = generateVacancyAnalysisPreview(input);

    expect(preview.excludedFields).toContain("Полный HTML");
    expect(preview.excludedFields).toContain("Cookies");
    expect(preview.excludedFields).toContain("Личные заметки");
    expect(preview.excludedFields).toContain("Вся база вакансий");
    expect(preview.excludedFields).toContain("История переписки");
  });

  it("calculates total character count", () => {
    const input = makeInput();
    const preview = generateVacancyAnalysisPreview(input);

    expect(preview.totalChars).toBeGreaterThan(0);
    // Should not exceed the sum of all field lengths
    const roughMax =
      input.job.title.length +
      input.job.company.length +
      (input.job.salaryRaw?.length ?? 0) +
      (input.job.city?.length ?? 0) +
      input.job.workMode.length +
      (input.job.experienceRaw?.length ?? 0) +
      input.job.skills.join(", ").length +
      input.job.descriptionClean.length +
      input.profile.summary.length +
      input.profile.targetTitles.join(", ").length +
      input.profile.mustHaveSkills.join(", ").length +
      input.profile.niceToHaveSkills.join(", ").length +
      (input.resumeHighlights?.length ?? 0);
    expect(preview.totalChars).toBeLessThanOrEqual(roughMax);
  });

  it("preview has proper IncludedField shape", () => {
    const input = makeInput();
    const preview = generateVacancyAnalysisPreview(input);

    for (const field of preview.includedFields) {
      expect(field).toHaveProperty("label");
      expect(field).toHaveProperty("summary");
      expect(typeof field.label).toBe("string");
      expect(typeof field.summary).toBe("string");
    }
  });

  it("truncates long summaries", () => {
    const input = makeInput({
      profile: {
        summary: "A".repeat(200),
        targetTitles: [],
        mustHaveSkills: [],
        niceToHaveSkills: [],
      },
    });
    const preview = generateVacancyAnalysisPreview(input);

    const summaryField = preview.includedFields.find(
      (f) => f.label === "Профиль — Summary",
    );
    expect(summaryField).toBeDefined();
    expect(summaryField!.summary).toContain("симв.");
    expect(summaryField!.summary.length).toBeLessThan(150);
  });
});

// ── Cover Letter preview ─────────────────────────────────────────────

describe("generateCoverLetterPreview", () => {
  function makeInput(overrides?: Partial<CoverLetterInput>): CoverLetterInput {
    return {
      job: {
        title: "Senior Frontend Developer",
        company: "Acme Corp",
        topRequirements: "React, TypeScript, Node.js",
        skills: ["React", "TypeScript", "Node.js"],
      },
      profile: {
        summary: "Frontend-разработчик с 5-летним опытом.",
      },
      resumeHighlights: "5 лет React; лидировал команду.",
      mode: "hh_standard",
      constraints: {
        noEmoji: true,
        noMarkdown: true,
        noSpecialChars: false,
        maxChars: 1000,
      },
      language: "ru",
      ...overrides,
    };
  }

  it("includes all cover letter fields", () => {
    const input = makeInput();
    const preview = generateCoverLetterPreview(input);

    const labels = preview.includedFields.map((f) => f.label);
    expect(labels).toContain("Название вакансии");
    expect(labels).toContain("Компания");
    expect(labels).toContain("Ключевые требования");
    expect(labels).toContain("Навыки");
    expect(labels).toContain("Профиль — Summary");
    expect(labels).toContain("Резюме — highlights");
    expect(labels).toContain("Режим письма");
    expect(labels).toContain("Язык");
  });

  it("returns standard mode", () => {
    const input = makeInput();
    const preview = generateCoverLetterPreview(input);

    expect(preview.mode).toBe("standard");
    expect(preview.estimatedTokens).toBeGreaterThan(0);
  });

  it("lists static exclusions", () => {
    const input = makeInput();
    const preview = generateCoverLetterPreview(input);

    expect(preview.excludedFields).toContain("Полный HTML");
    expect(preview.excludedFields).toContain("Cookies");
    expect(preview.excludedFields).toContain("Личные заметки");
  });

  it("calculates total character count", () => {
    const input = makeInput();
    const preview = generateCoverLetterPreview(input);

    expect(preview.totalChars).toBeGreaterThan(0);
  });

  it("handles empty resumeHighlights gracefully", () => {
    const input = makeInput({ resumeHighlights: "" });
    const preview = generateCoverLetterPreview(input);

    // Should still produce a valid preview without highlights in included
    const labels = preview.includedFields.map((f) => f.label);
    expect(labels).not.toContain("Резюме — highlights");
  });
});
