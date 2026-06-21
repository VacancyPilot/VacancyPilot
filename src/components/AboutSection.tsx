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
  const linkStyle: React.CSSProperties = {
    color: colors.blue,
    textDecoration: "none",
  };

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

      <div style={card}>
        <h3 style={cardHeading}>Policy & Support</h3>
        <p style={para}>
          Privacy policy, support, and security reporting are documented in the
          public repository.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, color: colors.textSecondary }}>
          <li>
            <a
              href="https://github.com/VacancyPilot/VacancyPilot/blob/main/PRIVACY.md"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <a
              href="https://github.com/VacancyPilot/VacancyPilot/blob/main/.github/SUPPORT.md"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              Support Guide
            </a>
          </li>
          <li>
            <a
              href="https://github.com/VacancyPilot/VacancyPilot/security/advisories/new"
              target="_blank"
              rel="noreferrer"
              style={linkStyle}
            >
              Report a Security Issue
            </a>
          </li>
        </ul>
      </div>

      <TrustSafetySummary level="compact" />
    </div>
  );
}
