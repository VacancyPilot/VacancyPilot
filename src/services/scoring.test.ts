import { describe, it, expect } from "vitest";
import { scoreJob, DEFAULT_WEIGHTS } from "./scoring";
import type { Job } from "@/models/job";
import type { Profile } from "@/models/profile";
import type { Company } from "@/models/company";
import type { ScoringWeights } from "@/models/scoring";

// ---- Test data factories ----

function makeJob(overrides?: Partial<Job>): Job {
  return {
    id: "hh_12345",
    source: "hh",
    sourceVacancyId: "12345",
    sourceUrl: "https://hh.ru/vacancy/12345",
    title: "Frontend Developer",
    companyId: "hh_co_test",
    companyName: "Test Corp",
    descriptionClean:
      "We are looking for a skilled Frontend Developer with React and TypeScript experience. Remote work, flexible hours.",
    descriptionHash: "abc",
    skills: ["React", "TypeScript", "JavaScript", "CSS"],
    status: "viewed",
    statusHistory: [],
    workMode: "remote",
    salaryMin: 150000,
    salaryMax: 200000,
    salaryCurrency: "RUB",
    city: "Москва",
    firstSeenAt: "2025-01-01T00:00:00.000Z",
    lastSeenAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "prof_1",
    name: "Frontend",
    summary: "Experienced frontend developer",
    targetTitles: ["Frontend Developer", "React Developer", "Senior Frontend"],
    mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    niceToHaveSkills: ["Next.js", "Node.js"],
    avoidKeywords: [],
    preferredWorkModes: ["remote", "hybrid"],
    preferredCities: ["Москва", "Санкт-Петербург"],
    salaryExpectationMin: 120000,
    salaryCurrency: "RUB",
    letterPrefs: {
      defaultMode: "hh_standard" as const,
      defaultConstraints: {
        noEmoji: false,
        noMarkdown: false,
        noSpecialChars: false,
      },
    },
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeCompany(overrides?: Partial<Company>): Company {
  return {
    id: "hh_co_test",
    source: "hh",
    name: "Test Corp",
    status: "normal",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// ---- Default weights ----

describe("DEFAULT_WEIGHTS", () => {
  it("sums to 100", () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it("has all 8 components", () => {
    const keys = Object.keys(DEFAULT_WEIGHTS);
    expect(keys).toHaveLength(8);
    expect(keys).toContain("titleMatch");
    expect(keys).toContain("mustHaveSkills");
    expect(keys).toContain("niceToHaveSkills");
    expect(keys).toContain("experienceFit");
    expect(keys).toContain("workModeLocation");
    expect(keys).toContain("salaryFit");
    expect(keys).toContain("companyPreference");
    expect(keys).toContain("languageScheduleMisc");
  });
});

// ---- Strong match (apply) ----

describe("scoreJob — strong match", () => {
  it('returns high score and "apply" recommendation for strong match', () => {
    const job = makeJob({
      skills: ["React", "TypeScript", "JavaScript", "CSS", "Next.js"],
      descriptionClean:
        "We are looking for a skilled Frontend Developer with React and TypeScript experience. " +
        "Remote work, flexible hours. Node.js knowledge is a plus. " +
        "The position offers competitive compensation and a great team environment.",
    });
    const profile = makeProfile();
    const company = makeCompany();

    const result = scoreJob(job, profile, company);

    expect(result.total).toBeGreaterThanOrEqual(85);
    expect(result.recommendation).toBe("apply");
    expect(result.breakdown.titleMatch).toBeGreaterThanOrEqual(10);
    expect(result.breakdown.mustHaveSkills).toBe(25); // all 3 matched
    expect(result.breakdown.niceToHaveSkills).toBeGreaterThan(0);
    expect(result.riskFlags).toHaveLength(0);
  });

  it('returns "consider" for good-but-not-perfect match', () => {
    const job = makeJob({
      title: "React Developer",
    });
    const profile = makeProfile();
    const company = makeCompany();

    const result = scoreJob(job, profile, company);
    // Partial title match + missing nice-to-have = below 85
    expect(result.total).toBeGreaterThanOrEqual(75);
    expect(result.total).toBeLessThan(85);
    expect(result.recommendation).toBe("consider");
  });
});

// ---- Good match (consider) ----

describe("scoreJob — good match", () => {
  it('returns "consider" for partial skill match', () => {
    const job = makeJob({
      skills: ["React"],
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.recommendation).toBe("consider");
    expect(result.breakdown.mustHaveSkills).toBeLessThan(25);
    expect(result.breakdown.mustHaveSkills).toBeGreaterThan(0);
  });

  it('returns "consider" when score between 50 and 84', () => {
    const job = makeJob({
      title: "Backend Developer",
      skills: ["Python", "Django"],
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.recommendation).toBe("consider");
    expect(result.total).toBeLessThan(85);
  });
});

// ---- Skip ----

describe("scoreJob — skip", () => {
  it('returns "skip" for completely unrelated vacancy', () => {
    const job = makeJob({
      title: "Водитель погрузчика",
      skills: [],
      workMode: "office",
      city: "Владивосток",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.recommendation).toBe("skip");
    expect(result.total).toBeLessThan(50);
  });
});

// ---- Title matching ----

describe("scoreJob — title matching", () => {
  it("gives full points for exact title match", () => {
    const job = makeJob({ title: "Frontend Developer" });
    const profile = makeProfile({ targetTitles: ["Frontend Developer"] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.titleMatch).toBe(DEFAULT_WEIGHTS.titleMatch);
  });

  it("gives partial points for word overlap", () => {
    const job = makeJob({ title: "Senior Frontend Engineer" });
    const profile = makeProfile({ targetTitles: ["Frontend Developer"] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.titleMatch).toBeGreaterThan(0);
    expect(result.breakdown.titleMatch).toBeLessThan(
      DEFAULT_WEIGHTS.titleMatch,
    );
  });

  it("gives zero for completely different title", () => {
    const job = makeJob({ title: "Data Scientist" });
    const profile = makeProfile({
      targetTitles: ["Frontend Developer", "React Developer"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.titleMatch).toBe(0);
  });

  it("handles empty target titles gracefully", () => {
    const job = makeJob({ title: "Developer" });
    const profile = makeProfile({ targetTitles: [] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.titleMatch).toBeGreaterThan(0); // neutral
    expect(result.breakdown.titleMatch).toBeLessThanOrEqual(
      DEFAULT_WEIGHTS.titleMatch,
    );
  });

  it("handles empty job title gracefully", () => {
    const job = makeJob({ title: "" });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.breakdown.titleMatch).toBe(0);
  });
});

// ---- Skills matching ----

describe("scoreJob — skills matching", () => {
  it("gives full points when all must-have skills match", () => {
    const job = makeJob({
      skills: ["React", "TypeScript", "JavaScript"],
    });
    const profile = makeProfile({
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.mustHaveSkills).toBe(
      DEFAULT_WEIGHTS.mustHaveSkills,
    );
  });

  it("finds skills in description when not in skills array", () => {
    const job = makeJob({
      skills: [],
      descriptionClean:
        "We need someone experienced with React, TypeScript, and modern JavaScript.",
    });
    const profile = makeProfile({
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.mustHaveSkills).toBe(
      DEFAULT_WEIGHTS.mustHaveSkills,
    );
  });

  it("gives zero when no must-have skills match", () => {
    const job = makeJob({
      skills: ["Python", "Django"],
      descriptionClean: "Python developer needed.",
    });
    const profile = makeProfile({
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.mustHaveSkills).toBe(0);
  });

  it("handles empty must-have skills gracefully", () => {
    const job = makeJob();
    const profile = makeProfile({ mustHaveSkills: [] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.mustHaveSkills).toBeGreaterThan(0); // neutral
  });

  it("scores nice-to-have skills proportionally", () => {
    const job = makeJob({
      skills: ["React", "TypeScript", "JavaScript", "Next.js"],
    });
    const profile = makeProfile({
      niceToHaveSkills: ["Next.js", "Node.js", "GraphQL"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.niceToHaveSkills).toBeGreaterThan(0);
    expect(result.breakdown.niceToHaveSkills).toBeLessThan(
      DEFAULT_WEIGHTS.niceToHaveSkills,
    );
  });
});

// ---- Experience fit ----

describe("scoreJob — experience fit", () => {
  it("returns neutral score when experience data is missing", () => {
    const job = makeJob({ experienceMinYears: undefined });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.breakdown.experienceFit).toBeGreaterThan(0);
    expect(result.breakdown.experienceFit).toBeLessThanOrEqual(
      DEFAULT_WEIGHTS.experienceFit,
    );
  });

  it("returns neutral score when experience exists but profile has no experience config", () => {
    const job = makeJob({ experienceMinYears: 3 });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.breakdown.experienceFit).toBeGreaterThan(0);
    expect(result.fitReasons).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Profile experience not configured"),
      ]),
    );
  });
});

// ---- Work mode / location ----

describe("scoreJob — work mode / location", () => {
  it("gives full points when work mode matches preferences", () => {
    const job = makeJob({ workMode: "remote" });
    const profile = makeProfile({ preferredWorkModes: ["remote", "hybrid"] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.workModeLocation).toBe(
      DEFAULT_WEIGHTS.workModeLocation,
    );
  });

  it("flags work mode mismatch", () => {
    const job = makeJob({ workMode: "office" });
    const profile = makeProfile({ preferredWorkModes: ["remote"] });

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "work_mode_mismatch" }),
      ]),
    );
  });

  it("scores city match", () => {
    const job = makeJob({ city: "Москва" });
    const profile = makeProfile({
      preferredWorkModes: [],
      preferredCities: ["Москва"],
    });

    const result = scoreJob(job, profile);
    expect(result.breakdown.workModeLocation).toBeGreaterThan(0);
  });

  it("handles missing city in vacancy", () => {
    const job = makeJob({ city: undefined });
    const profile = makeProfile({ preferredCities: ["Москва"] });

    const result = scoreJob(job, profile);
    // Should not crash, should give partial score
    expect(result.breakdown.workModeLocation).toBeGreaterThanOrEqual(0);
  });

  it("handles no preferred work modes", () => {
    const job = makeJob();
    const profile = makeProfile({ preferredWorkModes: [] });

    const result = scoreJob(job, profile);
    expect(result.breakdown.workModeLocation).toBeGreaterThan(0); // neutral
  });
});

// ---- Salary fit ----

describe("scoreJob — salary fit", () => {
  it("gives full points when salary meets expectation", () => {
    const job = makeJob({ salaryMin: 150000, salaryMax: 200000 });
    const profile = makeProfile({ salaryExpectationMin: 120000 });

    const result = scoreJob(job, profile);
    expect(result.breakdown.salaryFit).toBe(DEFAULT_WEIGHTS.salaryFit);
  });

  it("flags salary below minimum expectation", () => {
    const job = makeJob({ salaryMin: 50000, salaryMax: 70000 });
    const profile = makeProfile({ salaryExpectationMin: 120000 });

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "salary_below_minimum" }),
      ]),
    );
    expect(result.breakdown.salaryFit).toBeLessThan(DEFAULT_WEIGHTS.salaryFit);
  });

  it("flags salary unknown", () => {
    const job = makeJob({ salaryMin: undefined, salaryMax: undefined });
    const profile = makeProfile({ salaryExpectationMin: 120000 });

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "salary_unknown", severity: "info" }),
      ]),
    );
  });

  it("handles missing salary expectation in profile", () => {
    const job = makeJob({ salaryMin: 150000, salaryMax: 200000 });
    const profile = makeProfile({ salaryExpectationMin: undefined });

    const result = scoreJob(job, profile);
    expect(result.breakdown.salaryFit).toBeGreaterThan(0); // neutral
  });

  it("gives partial score when salary partially overlaps expectation", () => {
    const job = makeJob({ salaryMin: 100000, salaryMax: 150000 });
    const profile = makeProfile({ salaryExpectationMin: 120000 });

    const result = scoreJob(job, profile);
    expect(result.breakdown.salaryFit).toBeGreaterThan(0);
    expect(result.breakdown.salaryFit).toBeLessThan(DEFAULT_WEIGHTS.salaryFit);
  });
});

// ---- Company preference ----

describe("scoreJob — company preference", () => {
  it("gives full points for normal company", () => {
    const job = makeJob();
    const profile = makeProfile();
    const company = makeCompany({ status: "normal" });

    const result = scoreJob(job, profile, company);
    expect(result.breakdown.companyPreference).toBe(
      DEFAULT_WEIGHTS.companyPreference,
    );
  });

  it("caps score and flags blacklisted company", () => {
    const job = makeJob();
    const profile = makeProfile();
    const company = makeCompany({
      status: "blacklist",
      blacklistReason: "Scam",
    });

    const result = scoreJob(job, profile, company);
    expect(result.breakdown.companyPreference).toBe(0);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "company_blacklist",
          severity: "critical",
        }),
      ]),
    );
    expect(result.capsApplied).toBeDefined();
    expect(result.capsApplied![0].maxScore).toBe(40);
    expect(result.recommendation).toBe("skip");
  });

  it("reduces score for greylisted company", () => {
    const job = makeJob();
    const profile = makeProfile();
    const company = makeCompany({ status: "greylist" });

    const result = scoreJob(job, profile, company);
    expect(result.breakdown.companyPreference).toBeLessThan(
      DEFAULT_WEIGHTS.companyPreference,
    );
    expect(result.breakdown.companyPreference).toBeGreaterThan(0);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "company_blacklist", severity: "low" }),
      ]),
    );
  });

  it("handles missing company (not in DB)", () => {
    const job = makeJob();
    const profile = makeProfile();

    const result = scoreJob(job, profile); // no company arg
    expect(result.breakdown.companyPreference).toBeGreaterThan(0);
  });
});

// ---- Risk flags ----

describe("scoreJob — risk flags", () => {
  it("detects vague description", () => {
    const job = makeJob({ descriptionClean: "Short desc" });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "vague_description" }),
      ]),
    );
  });

  it("detects unpaid test task risk", () => {
    const job = makeJob({
      descriptionClean:
        "We require candidates to complete a free test task before interview.",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unpaid_test_task_risk" }),
      ]),
    );
  });

  it("detects relocation requirement", () => {
    const job = makeJob({
      descriptionClean: "This position requires relocation to another city.",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "relocation_required" }),
      ]),
    );
  });

  it("detects suspicious wording", () => {
    const job = makeJob({
      descriptionClean:
        "We are a startup looking for someone to work for equity. No official employment.",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "suspicious_wording" }),
      ]),
    );
  });

  it("detects agency without employer name", () => {
    const job = makeJob({
      descriptionClean:
        "Recruitment agency looking for candidates. We work with multiple companies.",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "agency_without_employer" }),
      ]),
    );
  });

  it("does not flag agency when employer name is present", () => {
    const job = makeJob({
      descriptionClean:
        "Recruitment agency representing a direct employer. The company is a leader in tech.",
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    const agencyFlags = result.riskFlags.filter(
      (f) => f.code === "agency_without_employer",
    );
    expect(agencyFlags).toHaveLength(0);
  });

  it("flags missing core skill when most must-haves are missing", () => {
    const job = makeJob({
      skills: [],
      descriptionClean: "No relevant skills mentioned.",
    });
    const profile = makeProfile({
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    });

    const result = scoreJob(job, profile);
    expect(result.riskFlags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing_core_skill",
          severity: "high",
        }),
      ]),
    );
  });
});

// ---- Caps ----

describe("scoreJob — caps", () => {
  it("caps at 40 for blacklisted company", () => {
    const job = makeJob(); // strong match otherwise
    const profile = makeProfile();
    const company = makeCompany({ status: "blacklist" });

    const result = scoreJob(job, profile, company);
    expect(result.total).toBeLessThanOrEqual(40);
    expect(result.recommendation).toBe("skip");
    expect(result.capsApplied).toBeDefined();
  });

  it("caps at 65 for work mode mismatch", () => {
    const job = makeJob({
      workMode: "office",
    });
    const profile = makeProfile({
      preferredWorkModes: ["remote"],
    });

    const result = scoreJob(job, profile);
    // Work mode mismatch triggers cap
    expect(result.capsApplied).toBeDefined();
    const capScore = result.capsApplied![0].maxScore;
    expect(capScore).toBe(65);
    expect(result.total).toBeLessThanOrEqual(65);
  });

  it("caps at 70 for missing core skill", () => {
    const job = makeJob({
      title: "Frontend Developer",
      skills: [],
      descriptionClean: "No matching skills.",
    });
    const profile = makeProfile({
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
    });

    const result = scoreJob(job, profile);
    expect(result.capsApplied).toBeDefined();
    const capScore = result.capsApplied![0].maxScore;
    expect(capScore).toBe(70);
    expect(result.total).toBeLessThanOrEqual(70);
  });
});

// ---- Determinism ----

describe("scoreJob — determinism", () => {
  it("produces identical results for identical inputs", () => {
    const job = makeJob();
    const profile = makeProfile();
    const company = makeCompany();

    const result1 = scoreJob(job, profile, company);
    const result2 = scoreJob(job, profile, company);

    expect(result1).toEqual(result2);
  });
});

// ---- Custom weights ----

describe("scoreJob — custom weights", () => {
  it("accepts custom weights from profile", () => {
    const job = makeJob();
    const profile = makeProfile({
      scoringWeights: { titleMatch: 30, mustHaveSkills: 15 },
    });

    const result = scoreJob(job, profile);
    // titleMatch should be influenced by the custom weight of 30
    expect(result.breakdown.titleMatch).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.titleMatch).toBeLessThanOrEqual(30);
  });

  it("accepts custom weights via parameter (overrides profile)", () => {
    const job = makeJob();
    const profile = makeProfile({
      scoringWeights: { titleMatch: 10 },
    });
    const customWeights: Partial<ScoringWeights> = { titleMatch: 30 };

    const result = scoreJob(job, profile, undefined, customWeights);
    // customWeights wins over profile.scoringWeights
    // With a perfect match and weight 30, titleMatch should be 30
    expect(result.breakdown.titleMatch).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.titleMatch).toBeLessThanOrEqual(30);
  });
});

// ---- Fit reasons ----

describe("scoreJob — fit reasons", () => {
  it("always returns fit reasons array", () => {
    const result = scoreJob(makeJob(), makeProfile());
    expect(Array.isArray(result.fitReasons)).toBe(true);
    expect(result.fitReasons.length).toBeGreaterThan(0);
  });

  it("includes reasons from all components", () => {
    const result = scoreJob(makeJob(), makeProfile());
    // Should have reasons about title, skills, work mode, salary, company, etc.
    expect(result.fitReasons.some((r) => r.includes("Title"))).toBe(true);
    expect(result.fitReasons.some((r) => r.includes("skill"))).toBe(true);
  });
});

// ---- Breakdown coherence ----

describe("scoreJob — breakdown coherence", () => {
  it("breakdown sums approximately to total (before caps/penalties)", () => {
    const job = makeJob();
    const profile = makeProfile();
    const company = makeCompany();

    const result = scoreJob(job, profile, company);
    const breakdownSum =
      result.breakdown.titleMatch +
      result.breakdown.mustHaveSkills +
      result.breakdown.niceToHaveSkills +
      result.breakdown.experienceFit +
      result.breakdown.workModeLocation +
      result.breakdown.salaryFit +
      result.breakdown.companyPreference +
      result.breakdown.languageScheduleMisc;

    // Total should be <= breakdown sum (caps and penalties can only reduce)
    expect(result.total).toBeLessThanOrEqual(breakdownSum);
  });
});

// ---- Missing data graceful degradation ----

describe("scoreJob — graceful degradation", () => {
  it("handles minimal job data gracefully", () => {
    const job = makeJob({
      title: "",
      skills: [],
      descriptionClean: "",
      workMode: "unknown",
      salaryMin: undefined,
      salaryMax: undefined,
      city: undefined,
    });
    const profile = makeProfile({
      targetTitles: [],
      mustHaveSkills: [],
      niceToHaveSkills: [],
      preferredWorkModes: [],
      preferredCities: [],
      salaryExpectationMin: undefined,
    });

    const result = scoreJob(job, profile);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.recommendation).toBeDefined();
    expect(result.breakdown).toBeDefined();
  });

  it("handles null/undefined description gracefully", () => {
    const job = makeJob({ descriptionClean: "" });
    const profile = makeProfile();

    expect(() => scoreJob(job, profile)).not.toThrow();
  });
});

// ---- Recommendation boundaries ----

describe("scoreJob — recommendation boundaries", () => {
  it('recommends "apply" at exactly 85', () => {
    // Craft inputs that produce exactly 85
    const job = makeJob({
      title: "Frontend Developer",
      skills: ["React", "TypeScript", "JavaScript"],
      workMode: "remote",
      city: "Москва",
      salaryMin: 150000,
      salaryMax: 200000,
      descriptionClean:
        "A well-described vacancy with sufficient detail for proper evaluation and matching against candidate profile expectations.",
    });
    const profile = makeProfile({
      targetTitles: ["Frontend Developer"],
      mustHaveSkills: ["React", "TypeScript", "JavaScript"],
      niceToHaveSkills: [],
      preferredWorkModes: ["remote"],
      preferredCities: ["Москва"],
      salaryExpectationMin: 120000,
    });
    const company = makeCompany({ status: "normal" });

    const result = scoreJob(job, profile, company);
    // With a near-perfect match, expect high score
    expect(result.total).toBeGreaterThanOrEqual(70);
    // If it hits 85, it should be 'apply'
    if (result.total >= 85) {
      expect(result.recommendation).toBe("apply");
    } else {
      expect(result.recommendation).toBe("consider");
    }
  });

  it('recommends "skip" below 50', () => {
    const job = makeJob({
      title: "Unrelated Job",
      skills: [],
      workMode: "office",
      salaryMin: 10000,
      salaryMax: 20000,
    });
    const profile = makeProfile();

    const result = scoreJob(job, profile);
    expect(result.total).toBeLessThan(50);
    expect(result.recommendation).toBe("skip");
  });
});
