import { useEffect, useState, type ReactNode } from "react";

type PageInfo =
  | { kind: "loading" }
  | { kind: "vacancy"; url: string }
  | { kind: "not-detected" };

/**
 * Synchronous check whether a URL looks like an HH.ru vacancy page.
 */
function isVacancyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === "hh.ru" || parsed.hostname.endsWith(".hh.ru")) &&
      /^\/vacancy\/\d+/i.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Show whether the active browser tab is on a recognized vacancy page.
 * Used in the popup to display "page detected / not detected" status.
 */
export function usePageStatus(): PageInfo {
  const [info, setInfo] = useState<PageInfo>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function detect(): Promise<void> {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (cancelled) return;

        if (tab?.url && isVacancyUrl(tab.url)) {
          setInfo({ kind: "vacancy", url: tab.url });
        } else {
          setInfo({ kind: "not-detected" });
        }
      } catch {
        if (!cancelled) {
          setInfo({ kind: "not-detected" });
        }
      }
    }

    detect();

    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}

interface PageStatusProps {
  info: PageInfo;
}

/**
 * Presentational component for page detection status in the popup.
 */
export function PageStatus({ info }: PageStatusProps): ReactNode {
  if (info.kind === "loading") {
    return (
      <span style={{ color: "#999", fontSize: 12 }}>
        Detecting page…
      </span>
    );
  }

  if (info.kind === "vacancy") {
    return (
      <span style={{ color: "#2a8", fontSize: 12 }}>
        Vacancy page detected
      </span>
    );
  }

  return (
    <span style={{ color: "#999", fontSize: 12 }}>
      Not a vacancy page
    </span>
  );
}
