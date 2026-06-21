import { jobRepo, profileRepo, resumeRepo } from "@/db/repositories";
import { loadSettings } from "@/db/settings-bridge";
import type { CoverLetterConstraints } from "@/models/cover-letter";
import type { CoverLetterInput } from "@/models/ai";
import type { AppSettings } from "@/models/settings";
import { buildCoverLetterInput } from "./ai-input-builders";
import { checkAiBudget, estimateCost } from "./ai-budget";
import { checkCoverLetterCache, storeCoverLetterCache } from "./ai-cache";
import {
  ensureProviderOriginAccess,
  hasProviderOriginAccess,
} from "./ai-provider-permissions";
import {
  checkAIReadiness,
  getLLMProvider,
  providerLabel,
} from "./ai-provider-factory";
import { generateCoverLetterPreview, type PayloadPreview } from "./payload-preview";
import { recordAiRequest } from "./ai-budget";

export interface CoverLetterAiRequest {
  jobId: string;
  profileId: string;
  resumeId?: string;
  mode: CoverLetterInput["mode"];
  constraints: CoverLetterConstraints;
}

export interface PreparedCoverLetterAiRequest {
  settings: AppSettings;
  input: CoverLetterInput;
  preview: PayloadPreview;
  provider: NonNullable<AppSettings["ai"]["provider"]>;
  providerLabel: string;
  model: string;
  promptVersion: string;
  cacheEnabled: boolean;
  optionalOriginGranted: boolean;
}

export interface CoverLetterAiGenerationResult {
  bodyText: string;
  provider: NonNullable<AppSettings["ai"]["provider"]>;
  providerLabel: string;
  model: string;
  promptVersion: string;
  fromCache: boolean;
}

const PROMPT_VERSION_BY_PROVIDER: Record<string, string> = {
  openai: "1.0.0",
  mock: "1.0.0",
};

function resolvePromptVersion(
  provider: NonNullable<AppSettings["ai"]["provider"]>,
): string {
  return PROMPT_VERSION_BY_PROVIDER[provider] ?? "1.0.0";
}

export async function prepareCoverLetterAiRequest(
  request: CoverLetterAiRequest,
): Promise<PreparedCoverLetterAiRequest> {
  const settings = await loadSettings();
  const readiness = checkAIReadiness(settings);
  if (!readiness.ready) {
    throw new Error(readiness.reason);
  }

  const provider = settings.ai.provider!;
  const model =
    settings.ai.model?.trim() || (provider === "openai" ? "gpt-4o" : "mock-gpt-4o");

  const [job, profile, resume] = await Promise.all([
    jobRepo.getById(request.jobId),
    profileRepo.getById(request.profileId),
    request.resumeId ? resumeRepo.getById(request.resumeId) : Promise.resolve(undefined),
  ]);

  if (!job) {
    throw new Error("Selected vacancy was not found in local storage.");
  }
  if (!profile) {
    throw new Error("Selected profile was not found in local storage.");
  }

  const input = buildCoverLetterInput(job, profile, settings, resume, {
    mode: request.mode,
    constraints: request.constraints,
  });

  return {
    settings,
    input,
    preview: generateCoverLetterPreview(input),
    provider,
    providerLabel: providerLabel(provider),
    model,
    promptVersion: resolvePromptVersion(provider),
    cacheEnabled: settings.ai.enableCache,
    optionalOriginGranted: await hasProviderOriginAccess(provider),
  };
}

export function buildCoverLetterAiCostSummary(
  prepared: PreparedCoverLetterAiRequest,
) {
  return estimateCost(
    prepared.preview.estimatedTokens,
    prepared.provider,
    prepared.model,
    0.5,
  );
}

export async function generateCoverLetterAiDraft(
  prepared: PreparedCoverLetterAiRequest,
  jobId?: string,
): Promise<CoverLetterAiGenerationResult> {
  const cached = await checkCoverLetterCache(
    prepared.input,
    prepared.provider,
    prepared.model,
    prepared.promptVersion,
    prepared.cacheEnabled,
  );

  if (cached.hit && cached.letter) {
    return {
      bodyText: cached.letter,
      provider: prepared.provider,
      providerLabel: prepared.providerLabel,
      model: prepared.model,
      promptVersion: prepared.promptVersion,
      fromCache: true,
    };
  }

  const budget = await checkAiBudget();
  if (!budget.allowed) {
    throw new Error(budget.reason);
  }

  const originAccess = await ensureProviderOriginAccess(prepared.provider);
  if (!originAccess.granted) {
    throw new Error(
      originAccess.reason ??
        `Optional ${prepared.providerLabel} API access was denied by the browser.`,
    );
  }

  const provider = getLLMProvider(prepared.settings);
  const bodyText = await provider.generateCoverLetter(prepared.input);

  if (prepared.cacheEnabled) {
    await storeCoverLetterCache({
      inputHash: cached.inputHash,
      kind: "cover_letter",
      provider: prepared.provider,
      model: prepared.model,
      promptVersion: prepared.promptVersion,
      letter: bodyText,
    });
  }

  await recordAiRequest("cover_letter", jobId);

  return {
    bodyText,
    provider: prepared.provider,
    providerLabel: prepared.providerLabel,
    model: prepared.model,
    promptVersion: prepared.promptVersion,
    fromCache: false,
  };
}
