// Vitest config for release audit mode (ITER-028).
// Sets RELEASE_AUDIT env flag so safety tests hard-fail when build output is missing.
process.env.RELEASE_AUDIT = "true";
export { default } from "./vitest.config";
