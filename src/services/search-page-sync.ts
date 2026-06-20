/**
 * Search page dynamic-list helpers — ITER-034/035 follow-up.
 *
 * Keeps search-surface rendering resilient when HH updates the result list
 * client-side after the initial content-script pass.
 */

export type RenderSearchBadgesFn = () => void | Promise<void>;

function isVacancyPilotNode(node: Node | null): boolean {
  if (!node) {
    return false;
  }

  const element =
    node.nodeType === 1
      ? (node as Element)
      : node.parentElement;

  if (!element) {
    return false;
  }

  return Boolean(
    element.closest("#vp-search-badge-styles") ??
      element.closest(".vp-sb-host") ??
      element.closest(".vp-sb-container") ??
      element.closest(".vp-sb-actions"),
  );
}

/**
 * Create a debounced render scheduler so repeated DOM mutations collapse
 * into a single refresh pass.
 */
export function createRenderScheduler(
  render: RenderSearchBadgesFn,
  delayMs = 80,
): () => void {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  return () => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      timerId = null;
      void render();
    }, delayMs);
  };
}

/**
 * Mutation filter for HH search result pages.
 * Re-render only when nodes are added or removed in the observed subtree.
 */
export function shouldRefreshSearchBadges(
  mutations: MutationRecord[],
): boolean {
  return mutations.some(
    (mutation) => {
      if (mutation.type !== "childList") {
        return false;
      }

      const structuralNodes = [
        ...Array.from(mutation.addedNodes),
        ...Array.from(mutation.removedNodes),
      ].filter((node) => !isVacancyPilotNode(node));

      if (structuralNodes.length > 0) {
        return true;
      }

      return !isVacancyPilotNode(mutation.target);
    },
  );
}

/**
 * Observe dynamic search-page list updates and trigger a debounced refresh.
 */
export function observeDynamicSearchList(
  doc: Document,
  onListChange: () => void,
): MutationObserver | null {
  const target = doc.body ?? doc.documentElement;
  if (!target) return null;
  const Observer =
    doc.defaultView?.MutationObserver ??
    globalThis.MutationObserver ??
    null;
  if (!Observer) return null;

  const observer = new Observer((mutations) => {
    if (shouldRefreshSearchBadges(mutations)) {
      onListChange();
    }
  });

  observer.observe(target, {
    childList: true,
    subtree: true,
  });

  return observer;
}
