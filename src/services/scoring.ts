import type { Job } from "@/models/job";
import type { Profile } from "@/models/profile";
import type { Company } from "@/models/company";
import type { ScoringWeights, ScoreResult, ScoreCap } from "@/models/scoring";
import type { RiskFlag, RiskCode } from "@/models/risk";

// ---- Default weights (sum = 100) ----

export const DEFAULT_WEIGHTS: ScoringWeights = {
  titleMatch: 20,
  mustHaveSkills: 25,
  niceToHaveSkills: 10,
  experienceFit: 15,
  workModeLocation: 10,
  salaryFit: 10,
  companyPreference: 5,
  languageScheduleMisc: 5,
};

// ---- Helpers ----

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function wordOverlap(a: string, b: string): number {
  const wordsA = new Set(normalize(a).split(/\s+/).filter(Boolean));
  const wordsB = new Set(normalize(b).split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

function textContains(text: string, term: string): boolean {
  return normalize(text).includes(normalize(term));
}

function textContainsAny(text: string, terms: string[]): boolean {
  return terms.some((t) => textContains(text, t));
}

function skillMatches(
  skill: string,
  jobSkills: string[],
  description: string,
): boolean {
  const norm = normalize(skill);
  if (jobSkills.some((s) => normalize(s) === norm)) return true;
  return textContains(description, skill);
}

// ---- Component scorers ----

interface ComponentResult {
  score: number;
  max: number;
  reasons: string[];
  riskFlags: RiskFlag[];
}

function makeFlag(
  code: RiskCode,
  severity: RiskFlag["severity"],
  message: string,
  evidence?: string,
): RiskFlag {
  return { code, severity, message, evidence };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Title / role match (max weight = DEFAULT_WEIGHTS.titleMatch)
 */
function scoreTitleMatch(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const titles = profile.targetTitles ?? [];
  const jobTitle = job.title ?? "";

  if (titles.length === 0) {
    reasons.push("No target titles configured");
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  if (!jobTitle) {
    reasons.push("Vacancy title is empty");
    return { score: 0, max: weight, reasons, riskFlags };
  }

  const jobTitleNorm = normalize(jobTitle);
  let bestOverlap = 0;
  let exactMatch = false;

  for (const title of titles) {
    const titleNorm = normalize(title);
    if (jobTitleNorm === titleNorm) {
      exactMatch = true;
      break;
    }
    const overlap = wordOverlap(jobTitleNorm, titleNorm);
    if (overlap > bestOverlap) bestOverlap = overlap;
  }

  if (exactMatch) {
    reasons.push(`Title exactly matches target: "${jobTitle}"`);
    return { score: weight, max: weight, reasons, riskFlags };
  }

  if (bestOverlap >= 0.7) {
    const score = Math.round(weight * 0.8);
    reasons.push(
      `Title strongly overlaps with target titles (${Math.round(bestOverlap * 100)}%)`,
    );
    return { score, max: weight, reasons, riskFlags };
  }

  if (bestOverlap >= 0.4) {
    const score = Math.round(weight * 0.5);
    reasons.push(
      `Title partially overlaps with target titles (${Math.round(bestOverlap * 100)}%)`,
    );
    return { score, max: weight, reasons, riskFlags };
  }

  if (bestOverlap > 0) {
    const score = Math.round(weight * 0.25);
    reasons.push(
      `Title weakly overlaps with target titles (${Math.round(bestOverlap * 100)}%)`,
    );
    return { score, max: weight, reasons, riskFlags };
  }

  reasons.push(`Title "${jobTitle}" does not match any target title`);
  return { score: 0, max: weight, reasons, riskFlags };
}

/**
 * Must-have skills (max weight = DEFAULT_WEIGHTS.mustHaveSkills)
 */
function scoreMustHaveSkills(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const required = profile.mustHaveSkills ?? [];
  const description = job.descriptionClean ?? "";
  const jobSkills = job.skills ?? [];

  if (required.length === 0) {
    reasons.push("No must-have skills configured");
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  let matched = 0;
  const missing: string[] = [];

  for (const skill of required) {
    if (skillMatches(skill, jobSkills, description)) {
      matched++;
    } else {
      missing.push(skill);
    }
  }

  const ratio = matched / required.length;
  const score = Math.round(ratio * weight);

  if (matched > 0) {
    reasons.push(`Matched ${matched}/${required.length} must-have skills`);
  }
  if (missing.length > 0) {
    const firstMissing = missing.slice(0, 3).join(", ");
    reasons.push(
      `Missing must-have skills: ${firstMissing}${missing.length > 3 ? "..." : ""}`,
    );

    // Core skill missing → risk flag (≥50% of must-haves absent)
    if (missing.length >= Math.ceil(required.length * 0.5)) {
      riskFlags.push(
        makeFlag(
          "missing_core_skill",
          "high",
          `Missing ${missing.length} core must-have skills: ${firstMissing}`,
        ),
      );
    }
  }

  return { score, max: weight, reasons, riskFlags };
}

/**
 * Nice-to-have skills (max weight = DEFAULT_WEIGHTS.niceToHaveSkills)
 */
function scoreNiceToHaveSkills(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];
  const nice = profile.niceToHaveSkills ?? [];
  const description = job.descriptionClean ?? "";
  const jobSkills = job.skills ?? [];

  if (nice.length === 0) {
    reasons.push("No nice-to-have skills configured");
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  let matched = 0;
  for (const skill of nice) {
    if (skillMatches(skill, jobSkills, description)) matched++;
  }

  const ratio = matched / nice.length;
  const score = Math.round(ratio * weight);

  if (matched > 0) {
    reasons.push(`Matched ${matched}/${nice.length} nice-to-have skills`);
  }

  return { score, max: weight, reasons, riskFlags };
}

/**
 * Experience fit (max weight = DEFAULT_WEIGHTS.experienceFit)
 *
 * Profile currently lacks experienceYears field, so scoring is neutral
 * when data is unavailable. Provides fit reasons when experience data exists.
 */
function scoreExperienceFit(
  job: Job,
  _profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];

  if (job.experienceMinYears == null) {
    reasons.push("Experience requirement not parsed from vacancy");
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  // Profile has no experienceYears yet — neutral score with informational note
  reasons.push(`Vacancy requires ~${job.experienceMinYears}+ years experience`);
  reasons.push("Profile experience not configured — scored neutrally");
  return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
}

/**
 * Work mode / location (max weight = DEFAULT_WEIGHTS.workModeLocation)
 */
function scoreWorkModeLocation(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];

  const preferredModes = profile.preferredWorkModes ?? [];
  const preferredCities = profile.preferredCities ?? [];
  const jobMode = job.workMode ?? "unknown";
  const jobCity = job.city;

  let score = 0;
  const modeWeight =
    preferredCities.length > 0 ? Math.round(weight * 0.6) : weight;
  const cityWeight = weight - modeWeight;

  // Work mode scoring
  if (preferredModes.length === 0) {
    score += Math.round(modeWeight * 0.5);
    reasons.push("No preferred work modes configured");
  } else if (jobMode === "unknown") {
    score += Math.round(modeWeight * 0.5);
    reasons.push("Work mode not specified in vacancy");
  } else if (preferredModes.includes(jobMode)) {
    score += modeWeight;
    reasons.push(`Work mode "${jobMode}" matches preferences`);
  } else {
    // Mismatch
    score += 0;
    reasons.push(
      `Work mode "${jobMode}" does not match preferences (${preferredModes.join(", ")})`,
    );
    riskFlags.push(
      makeFlag(
        "work_mode_mismatch",
        "medium",
        `Work mode "${jobMode}" not in preferred modes`,
      ),
    );
  }

  // City/location scoring
  if (preferredCities.length === 0) {
    score += Math.round(cityWeight * 0.5);
  } else if (!jobCity) {
    score += Math.round(cityWeight * 0.5);
    reasons.push("City not specified in vacancy");
  } else {
    const cityNorm = normalize(jobCity);
    const match = preferredCities.some(
      (c) =>
        normalize(c) === cityNorm ||
        normalize(c).includes(cityNorm) ||
        cityNorm.includes(normalize(c)),
    );
    if (match) {
      score += cityWeight;
      reasons.push(`City "${jobCity}" matches preferences`);
    } else {
      score += 0;
      reasons.push(
        `City "${jobCity}" not in preferred cities (${preferredCities.join(", ")})`,
      );
    }
  }

  return { score: clamp(score, 0, weight), max: weight, reasons, riskFlags };
}

/**
 * Salary fit (max weight = DEFAULT_WEIGHTS.salaryFit)
 */
function scoreSalaryFit(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];

  if (job.salaryMin == null && job.salaryMax == null) {
    reasons.push("Salary not specified in vacancy");
    riskFlags.push(
      makeFlag("salary_unknown", "info", "Salary not provided in vacancy"),
    );
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  const profileMin = profile.salaryExpectationMin;
  if (profileMin == null) {
    reasons.push("No salary expectation configured — scored neutrally");
    return { score: Math.round(weight * 0.5), max: weight, reasons, riskFlags };
  }

  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? jobMin;

  // Both min and max below profile expectation
  if (jobMax < profileMin) {
    const shortfall = profileMin - jobMax;
    const penaltyRatio = Math.min(1, shortfall / Math.max(1, profileMin));
    const score = Math.round(weight * (1 - penaltyRatio));
    const clamped = clamp(score, 0, weight);
    reasons.push(
      `Salary range ${jobMin}–${jobMax} below expectation ${profileMin}`,
    );
    riskFlags.push(
      makeFlag(
        "salary_below_minimum",
        "medium",
        `Max salary ${jobMax} below expected ${profileMin}`,
      ),
    );
    return { score: clamped, max: weight, reasons, riskFlags };
  }

  // Min is below but max is above
  if (jobMin < profileMin && jobMax >= profileMin) {
    const score = Math.round(weight * 0.7);
    reasons.push(
      `Salary range ${jobMin}–${jobMax} partially covers expectation ${profileMin}`,
    );
    return { score, max: weight, reasons, riskFlags };
  }

  // Both above
  reasons.push(
    `Salary range ${jobMin}–${jobMax} meets expectation ${profileMin}`,
  );
  return { score: weight, max: weight, reasons, riskFlags };
}

/**
 * Company preference (max weight = DEFAULT_WEIGHTS.companyPreference)
 */
function scoreCompanyPreference(
  company: Company | undefined,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];

  if (!company) {
    reasons.push("Company not in local database");
    return { score: Math.round(weight * 0.8), max: weight, reasons, riskFlags };
  }

  switch (company.status) {
    case "blacklist":
      reasons.push(
        `Company "${company.name}" is blacklisted: ${company.blacklistReason ?? "no reason given"}`,
      );
      riskFlags.push(
        makeFlag(
          "company_blacklist",
          "critical",
          `Company "${company.name}" is blacklisted`,
          company.blacklistReason,
        ),
      );
      return { score: 0, max: weight, reasons, riskFlags };
    case "greylist":
      reasons.push(`Company "${company.name}" is greylisted`);
      riskFlags.push(
        makeFlag(
          "company_blacklist",
          "low",
          `Company "${company.name}" is greylisted`,
        ),
      );
      return {
        score: Math.round(weight * 0.3),
        max: weight,
        reasons,
        riskFlags,
      };
    case "normal":
    default:
      reasons.push(`Company "${company.name}" has no restrictions`);
      return { score: weight, max: weight, reasons, riskFlags };
  }
}

/**
 * Language / schedule / misc (max weight = DEFAULT_WEIGHTS.languageScheduleMisc)
 */
function scoreLanguageScheduleMisc(
  job: Job,
  profile: Profile,
  weight: number,
): ComponentResult {
  const reasons: string[] = [];
  const riskFlags: RiskFlag[] = [];
  let score = weight;

  const description = job.descriptionClean ?? "";

  // Check for relocation requirement
  const relocationKeywords = ["relocation", "relocate", "переезд", "релокация"];
  if (textContainsAny(description, relocationKeywords)) {
    score -= Math.round(weight * 0.2);
    reasons.push("Vacancy mentions relocation");
    riskFlags.push(
      makeFlag(
        "relocation_required",
        "low",
        "Vacancy requires or mentions relocation",
      ),
    );
  }

  // Check schedule (informational — no schedule prefs in Profile yet)
  if (job.schedule) {
    reasons.push(`Schedule: ${job.schedule}`);
  }

  // Detect vague description
  if (description.length < 100) {
    score -= Math.round(weight * 0.15);
    reasons.push("Very short description — may be vague");
    riskFlags.push(
      makeFlag(
        "vague_description",
        "low",
        "Vacancy description is very short (<100 chars)",
      ),
    );
  } else if (description.length < 250) {
    score -= Math.round(weight * 0.05);
    reasons.push("Short description — limited detail");
  }

  // Detect agency without employer
  const agencyKeywords = [
    "agency",
    "агентство",
    "кадровое агентство",
    "recruitment agency",
    "staffing",
  ];
  const hasAgency = textContainsAny(description, agencyKeywords);
  const hasEmployer = textContainsAny(description, [
    "компания-работодатель",
    "direct employer",
    "прямой работодатель",
  ]);
  if (hasAgency && !hasEmployer) {
    reasons.push("Agency posting without clear employer name");
    riskFlags.push(
      makeFlag(
        "agency_without_employer",
        "low",
        "Vacancy posted by agency without employer name",
      ),
    );
  }

  // Detect unpaid test task risk
  const testTaskKeywords = [
    "тестовое задание",
    "test task",
    "test assignment",
    "пробное задание",
  ];
  const unpaidKeywords = ["бесплатное", "unpaid", "без оплаты", "free"];
  if (
    textContainsAny(description, testTaskKeywords) &&
    textContainsAny(description, unpaidKeywords)
  ) {
    reasons.push("Unpaid test task detected");
    riskFlags.push(
      makeFlag(
        "unpaid_test_task_risk",
        "medium",
        "Vacancy mentions unpaid test task",
      ),
    );
  }

  // Detect suspicious wording
  const suspiciousPatterns = [
    "работа за идею",
    "стартап на энтузиазме",
    "work for equity",
    "оплата по результатам",
    "payment after results",
    "без оформления",
    "no official employment",
    "испытательный срок без оплаты",
  ];
  if (textContainsAny(description, suspiciousPatterns)) {
    score -= Math.round(weight * 0.3);
    reasons.push("Suspicious wording detected");
    riskFlags.push(
      makeFlag(
        "suspicious_wording",
        "medium",
        "Vacancy contains suspicious wording",
      ),
    );
  }

  return { score: clamp(score, 0, weight), max: weight, reasons, riskFlags };
}

// ---- Caps and penalties ----

interface CapRule {
  condition: (riskFlags: RiskFlag[]) => boolean;
  cap: ScoreCap;
}

const CAP_RULES: CapRule[] = [
  {
    condition: (flags) =>
      flags.some(
        (f) => f.code === "company_blacklist" && f.severity === "critical",
      ),
    cap: { reason: "Company is blacklisted", maxScore: 40 },
  },
  {
    condition: (flags) =>
      flags.some(
        (f) => f.code === "work_mode_mismatch" && f.severity === "medium",
      ),
    cap: { reason: "Critical work mode mismatch", maxScore: 65 },
  },
  {
    condition: (flags) =>
      flags.some(
        (f) => f.code === "missing_core_skill" && f.severity === "high",
      ),
    cap: { reason: "Missing core must-have skill", maxScore: 70 },
  },
];

function collectCaps(riskFlags: RiskFlag[]): ScoreCap[] {
  return CAP_RULES.filter((rule) => rule.condition(riskFlags)).map(
    (rule) => rule.cap,
  );
}

function applyCaps(
  total: number,
  caps: ScoreCap[],
): { cappedTotal: number; applied: ScoreCap[] } {
  if (caps.length === 0) return { cappedTotal: total, applied: [] };

  const lowestCap = caps.reduce(
    (min, c) => (c.maxScore < min.maxScore ? c : min),
    caps[0],
  );
  const capped = Math.min(total, lowestCap.maxScore);

  return {
    cappedTotal: capped,
    applied: [lowestCap],
  };
}

// ---- Penalties ----

interface Penalty {
  condition: (riskFlags: RiskFlag[]) => boolean;
  amount: number;
  reason: string;
}

const PENALTIES: Penalty[] = [
  {
    condition: (flags) =>
      flags.some(
        (f) => f.code === "salary_below_minimum" && f.severity === "medium",
      ),
    amount: 15,
    reason: "Salary below minimum expectation",
  },
  {
    condition: (flags) =>
      flags.some(
        (f) => f.code === "suspicious_wording" && f.severity === "medium",
      ),
    amount: 15,
    reason: "Suspicious wording detected",
  },
  {
    condition: (flags) =>
      flags.some((f) => f.code === "vague_description" && f.severity === "low"),
    amount: 5,
    reason: "Vague or very short description",
  },
];

// ---- Recommendation ----

function determineRecommendation(
  total: number,
  riskFlags: RiskFlag[],
): ScoreResult["recommendation"] {
  const hasCritical = riskFlags.some((f) => f.severity === "critical");
  if (hasCritical) return "skip";

  if (total >= 85) return "apply";
  if (total >= 50) return "consider";
  return "skip";
}

// ---- Main scoring function ----

/**
 * Compute a deterministic ScoreResult for a job against a profile.
 *
 * Pure function — no side effects, no AI, no network.
 * Returns the same result for the same inputs every time.
 */
export function scoreJob(
  job: Job,
  profile: Profile,
  company?: Company,
  customWeights?: Partial<ScoringWeights>,
): ScoreResult {
  const weights: ScoringWeights = {
    ...DEFAULT_WEIGHTS,
    ...profile.scoringWeights,
    ...customWeights,
  };

  // Run component scorers
  const titleResult = scoreTitleMatch(job, profile, weights.titleMatch);
  const mustHaveResult = scoreMustHaveSkills(
    job,
    profile,
    weights.mustHaveSkills,
  );
  const niceToHaveResult = scoreNiceToHaveSkills(
    job,
    profile,
    weights.niceToHaveSkills,
  );
  const experienceResult = scoreExperienceFit(
    job,
    profile,
    weights.experienceFit,
  );
  const workModeResult = scoreWorkModeLocation(
    job,
    profile,
    weights.workModeLocation,
  );
  const salaryResult = scoreSalaryFit(job, profile, weights.salaryFit);
  const companyResult = scoreCompanyPreference(
    company,
    weights.companyPreference,
  );
  const miscResult = scoreLanguageScheduleMisc(
    job,
    profile,
    weights.languageScheduleMisc,
  );

  // Aggregate
  const breakdown: ScoreResult["breakdown"] = {
    titleMatch: titleResult.score,
    mustHaveSkills: mustHaveResult.score,
    niceToHaveSkills: niceToHaveResult.score,
    experienceFit: experienceResult.score,
    workModeLocation: workModeResult.score,
    salaryFit: salaryResult.score,
    companyPreference: companyResult.score,
    languageScheduleMisc: miscResult.score,
  };

  const fitReasons: string[] = [
    ...titleResult.reasons,
    ...mustHaveResult.reasons,
    ...niceToHaveResult.reasons,
    ...experienceResult.reasons,
    ...workModeResult.reasons,
    ...salaryResult.reasons,
    ...companyResult.reasons,
    ...miscResult.reasons,
  ];

  const riskFlags: RiskFlag[] = [
    ...titleResult.riskFlags,
    ...mustHaveResult.riskFlags,
    ...niceToHaveResult.riskFlags,
    ...experienceResult.riskFlags,
    ...workModeResult.riskFlags,
    ...salaryResult.riskFlags,
    ...companyResult.riskFlags,
    ...miscResult.riskFlags,
  ];

  let total =
    breakdown.titleMatch +
    breakdown.mustHaveSkills +
    breakdown.niceToHaveSkills +
    breakdown.experienceFit +
    breakdown.workModeLocation +
    breakdown.salaryFit +
    breakdown.companyPreference +
    breakdown.languageScheduleMisc;

  // Apply penalties
  for (const penalty of PENALTIES) {
    if (penalty.condition(riskFlags)) {
      total -= penalty.amount;
      fitReasons.push(`Penalty: ${penalty.reason} (-${penalty.amount})`);
    }
  }

  total = clamp(total, 0, 100);

  // Apply caps
  const caps = collectCaps(riskFlags);
  const { cappedTotal, applied } = applyCaps(total, caps);

  // Determine recommendation based on capped total
  const recommendation = determineRecommendation(cappedTotal, riskFlags);

  return {
    total: cappedTotal,
    recommendation,
    breakdown,
    fitReasons,
    riskFlags,
    capsApplied: applied.length > 0 ? applied : undefined,
  };
}
