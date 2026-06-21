import type { AppSettings } from "@/models/settings";

const PROVIDER_OPTIONAL_ORIGINS: Partial<
  Record<NonNullable<AppSettings["ai"]["provider"]>, string>
> = {
  openai: "https://api.openai.com/*",
};

export interface ProviderOriginAccess {
  granted: boolean;
  requested: boolean;
  origin?: string;
  reason?: string;
}

export function getProviderOptionalOrigin(
  provider: AppSettings["ai"]["provider"],
): string | null {
  if (!provider) return null;
  return PROVIDER_OPTIONAL_ORIGINS[provider] ?? null;
}

export async function hasProviderOriginAccess(
  provider: AppSettings["ai"]["provider"],
): Promise<boolean> {
  const origin = getProviderOptionalOrigin(provider);
  if (!origin) return true;

  const permissionsApi = chrome.permissions;
  if (!permissionsApi?.contains) {
    return true;
  }

  return permissionsApi.contains({ origins: [origin] });
}

export async function ensureProviderOriginAccess(
  provider: AppSettings["ai"]["provider"],
): Promise<ProviderOriginAccess> {
  const origin = getProviderOptionalOrigin(provider);
  if (!origin) {
    return { granted: true, requested: false };
  }

  const permissionsApi = chrome.permissions;
  if (!permissionsApi?.contains || !permissionsApi.request) {
    return { granted: true, requested: false, origin };
  }

  const alreadyGranted = await permissionsApi.contains({ origins: [origin] });
  if (alreadyGranted) {
    return { granted: true, requested: false, origin };
  }

  const granted = await permissionsApi.request({ origins: [origin] });
  return {
    granted,
    requested: true,
    origin,
    reason: granted
      ? undefined
      : `Browser denied optional access to ${origin}.`,
  };
}
