import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    manifest_version: 3,
    name: "VacancyPilot",
    short_name: "VacancyPilot",
    version: "0.1.0",
    description: "Local-first HH.ru job search copilot",
    permissions: ["storage", "sidePanel"],
    host_permissions: [],
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
