import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  // src/ is the source root; entrypoints/ and public/ live outside it at project root.
  // WXT automatically sets @ -> srcDir, so @/components resolves to src/components.
  srcDir: "src",
  entrypointsDir: "../entrypoints",
  publicDir: "public",
  manifestVersion: 3,
  manifest: {
    name: "VacancyPilot",
    short_name: "VacancyPilot",
    version: "0.1.0",
    description: "Local-first HH.ru job search copilot",
    permissions: ["storage", "sidePanel", "activeTab"],
    host_permissions: [],
    optional_host_permissions: ["https://api.openai.com/*"],
    optional_permissions: [],
    icons: {
      16: "/icons/icon-128.svg",
      32: "/icons/icon-128.svg",
      48: "/icons/icon-128.svg",
      96: "/icons/icon-128.svg",
      128: "/icons/icon-128.svg",
    },
  },
});
