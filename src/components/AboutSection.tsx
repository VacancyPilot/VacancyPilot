import type { ReactNode } from "react";
import { sectionHeading, para, card, cardHeading, listStyle } from "@/styles";

const doItem: React.CSSProperties = { color: "#2a8" };
const dontItem: React.CSSProperties = { color: "#c44" };

export function AboutSection(): ReactNode {
  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={sectionHeading}>About VacancyPilot</h2>
      <p style={para}>
        VacancyPilot is a <strong>local-first, read-first</strong> copilot for
        HH.ru. It helps you analyze vacancies, prepare cover letters, and track
        your job search history — all from your browser, with no cloud backend.
      </p>

      <div style={card}>
        <h3 style={cardHeading}>What VacancyPilot Does</h3>
        <ul style={listStyle}>
          <li style={doItem}>
            Extracts vacancy data (title, company, salary, skills) from HH.ru
            pages you open
          </li>
          <li style={doItem}>
            Scores vacancies against your profile using local, rule-based
            scoring
          </li>
          <li style={doItem}>
            Tracks your application status history (Saved → Applied → Interview
            → Offer, etc.)
          </li>
          <li style={doItem}>
            Generates cover letters with AI assistance (opt-in, requires your
            own API key)
          </li>
          <li style={doItem}>
            Provides AI-powered vacancy analysis (opt-in, payload preview before
            every request)
          </li>
          <li style={doItem}>Exports your data as CSV or JSON at any time</li>
          <li style={doItem}>
            Sends optional notifications via your own n8n webhook (opt-in, Labs)
          </li>
        </ul>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>What VacancyPilot Does NOT Do</h3>
        <ul style={listStyle}>
          <li style={dontItem}>
            Does not auto-submit applications or fill HH.ru forms
          </li>
          <li style={dontItem}>
            Does not auto-click HH.ru controls or simulate user actions
          </li>
          <li style={dontItem}>
            Does not access your HH.ru login, cookies, or session
          </li>
          <li style={dontItem}>
            Does not send data to developer servers — there are none
          </li>
          <li style={dontItem}>
            Does not collect analytics, telemetry, or crash reports
          </li>
          <li style={dontItem}>
            Does not bypass CAPTCHA or anti-bot protections
          </li>
          <li style={dontItem}>
            Does not work on websites other than HH.ru (no multi-site in MVP)
          </li>
        </ul>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>Key Principles</h3>
        <ul style={listStyle}>
          <li>
            <strong>Local-first</strong> — All data stays in your browser
            (IndexedDB + chrome.storage.local). No cloud sync.
          </li>
          <li>
            <strong>Read-first</strong> — The extension reads vacancy pages you
            open. It never writes to HH.ru.
          </li>
          <li>
            <strong>User in control</strong> — You decide what to save, score,
            or send. Every AI and n8n request shows a payload preview.
          </li>
          <li>
            <strong>Works without AI</strong> — Scoring works with local rules.
            AI is optional and requires your own API key.
          </li>
          <li>
            <strong>Privacy by default</strong> — Strict Privacy mode is on by
            default. Contacts are redacted. No telemetry.
          </li>
          <li>
            <strong>Core vs Labs</strong> — Experimental features (Labs) are off
            by default. You enable them explicitly.
          </li>
        </ul>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>Stack</h3>
        <p style={{ ...para, margin: 0 }}>
          Manifest V3 · WXT · TypeScript · React · Dexie (IndexedDB) ·
          chrome.storage.local · Vitest
        </p>
      </div>
    </div>
  );
}
