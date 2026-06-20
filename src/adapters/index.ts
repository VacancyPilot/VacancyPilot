// Adapters barrel export
export type {
  SourceSite,
  PageKind,
  SiteAdapter,
  RawSearchItemDTO,
  ApplicationStatusSync,
} from "./types";
export type { RawVacancyDTO, ParserWarning, ParserSeverity } from "./hh/types";
export { SELECTORS_V1, SELECTOR_VERSION } from "./hh/selectors-v1";
export type { SelectorMap, SelectorField } from "./hh/selectors-v1";
export { HR_SELECTORS, HR_SELECTOR_VERSION } from "./hh/hr-selectors";
export type { HrSelectorMap, HrSelectorField } from "./hh/hr-selectors";
export { HHAdapter } from "./hh/hh-adapter";
