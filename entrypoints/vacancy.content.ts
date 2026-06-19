import { defineContentScript } from "wxt/sandbox";

export default defineContentScript({
  // Narrow scope: only HH.ru vacancy pages.
  // Added in ITER-001 as a placeholder; extraction logic comes in the parser iteration.
  matches: ["https://hh.ru/vacancy/*"],
  main() {
    console.log("[VacancyPilot] content script loaded on vacancy page");
  },
});
