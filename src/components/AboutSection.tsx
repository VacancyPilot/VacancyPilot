import type { ReactNode } from "react";
import { TrustSafetySummary } from "@/components/TrustSafetySummary";
import {
  sectionHeading,
  para,
  card,
  cardHeading,
  colors,
  fontSizes,
} from "@/styles";

export function AboutSection(): ReactNode {
  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={sectionHeading}>About VacancyPilot</h2>
      <p style={para}>
        VacancyPilot is a <strong>local-first, read-first</strong> copilot for
        HH.ru. It helps you analyze vacancies, prepare cover letters, and track
        your job search history — all from your browser, with no cloud backend.
      </p>

      <div style={{ ...card, padding: "10px 14px", marginBottom: 14 }}>
        <p
          style={{
            fontSize: fontSizes.md,
            color: colors.textMuted,
            margin: 0,
          }}
        >
          <strong>Status:</strong> Private alpha · dogfooding
        </p>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>Stack</h3>
        <p style={{ ...para, margin: 0 }}>
          Manifest V3 · WXT · TypeScript · React · Dexie (IndexedDB) ·
          chrome.storage.local · Vitest
        </p>
      </div>

      <TrustSafetySummary level="compact" />
    </div>
  );
}
