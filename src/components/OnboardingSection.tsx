import { useState, useCallback, type ReactNode, type FormEvent } from "react";
import { loadSettings, saveSettings } from "@/db/settings-bridge";
import {
  sectionHeading,
  card,
  cardHeading,
  listStyle,
  primaryButton,
  colors,
  fontSizes,
  fontWeights,
} from "@/styles";

const stepHeading: React.CSSProperties = {
  fontSize: fontSizes.cardHeading,
  fontWeight: fontWeights.semibold,
  margin: "14px 0 6px",
  color: colors.navy,
};

const stepDesc: React.CSSProperties = {
  fontSize: fontSizes.md,
  color: colors.textMuted,
  margin: "0 0 8px",
};

export function OnboardingSection(): ReactNode {
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleComplete = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const settings = await loadSettings();
      settings.onboardingCompleted = true;
      await saveSettings(settings);
      setCompleted(true);
    } catch {
      // If saving fails, user can retry.
    } finally {
      setSaving(false);
    }
  }, []);

  if (completed) {
    return (
      <div style={{ maxWidth: 560 }}>
        <h2 style={sectionHeading}>Onboarding Complete ✓</h2>
        <div style={card}>
          <p
            style={{ fontSize: fontSizes.body, color: colors.green, margin: 0 }}
          >
            You&apos;re all set! Navigate to any HH.ru vacancy page to start
            using VacancyPilot.
          </p>
          <p
            style={{
              fontSize: fontSizes.md,
              color: colors.textMuted,
              margin: "10px 0 0",
            }}
          >
            Tip: open a vacancy like <code>https://hh.ru/vacancy/12345678</code>{" "}
            and look for the VacancyPilot badge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={sectionHeading}>Welcome to VacancyPilot</h2>
      <p
        style={{
          fontSize: fontSizes.md,
          color: colors.textMuted,
          margin: "0 0 14px",
        }}
      >
        This quick guide explains what the extension does, what permissions it
        uses, and how to get started.
      </p>

      {/* ── What it does ── */}
      <div style={card}>
        <h3 style={cardHeading}>What VacancyPilot Does</h3>
        <ul style={listStyle}>
          <li>Parses and scores HH.ru vacancies you open, using local rules</li>
          <li>Tracks your application status history</li>
          <li>Generates cover letters with AI (opt-in, your own API key)</li>
          <li>Provides AI-powered vacancy analysis (opt-in)</li>
          <li>Exports your data as CSV or JSON</li>
          <li>
            Sends optional event notifications via your own n8n webhook (opt-in,
            Labs)
          </li>
        </ul>
      </div>

      {/* ── What it does NOT do ── */}
      <div style={card}>
        <h3 style={cardHeading}>What VacancyPilot Does NOT Do</h3>
        <ul style={{ ...listStyle, color: colors.red }}>
          <li>Does not auto-submit applications or fill HH.ru forms</li>
          <li>Does not auto-click HH.ru controls or simulate user actions</li>
          <li>Does not access your HH.ru login, cookies, or session</li>
          <li>Does not send data to developer servers — there are none</li>
          <li>Does not collect analytics, telemetry, or crash reports</li>
          <li>Does not bypass CAPTCHA or anti-bot protections</li>
        </ul>
      </div>

      {/* ── Permissions ── */}
      <div style={card}>
        <h3 style={cardHeading}>Permissions Used</h3>
        <ul style={listStyle}>
          <li>
            <strong>storage</strong> — Saves vacancy data, settings, and
            profiles locally in your browser
          </li>
          <li>
            <strong>sidePanel</strong> — Opens a side panel on HH.ru vacancy
            pages for analysis and actions
          </li>
          <li>
            <strong>activeTab</strong> — Reads the current vacancy page to
            extract job data (title, company, salary, etc.)
          </li>
        </ul>
        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textFaint,
            margin: "8px 0 0",
          }}
        >
          This build declares only <strong>storage</strong>,{" "}
          <strong>sidePanel</strong>, and <strong>activeTab</strong>. It does
          not declare install-time host permissions. OpenAI host access is
          optional and requested only when you confirm an AI request.
        </p>
      </div>

      {/* ── Data storage ── */}
      <div style={card}>
        <h3 style={cardHeading}>Where Data Is Stored</h3>
        <ul style={listStyle}>
          <li>
            All data is stored <strong>only in your browser</strong>: IndexedDB
            for vacancy data and profiles, <code>chrome.storage.local</code> for
            settings and API keys
          </li>
          <li>No cloud sync, no developer backend, no third-party storage</li>
          <li>
            You can export all data (CSV or JSON) and delete everything from the
            Dashboard at any time
          </li>
        </ul>
      </div>

      {/* ── AI ── */}
      <div style={card}>
        <h3 style={cardHeading}>How AI Works</h3>
        <ul style={listStyle}>
          <li>
            AI features are <strong>opt-in</strong> — you must provide your own
            API key
          </li>
          <li>
            AI is powered by your chosen provider. This build currently supports
            OpenAI and Mock
          </li>
          <li>
            Every AI request shows a <strong>payload preview</strong> before
            sending — you review and confirm
          </li>
          <li>
            <strong>Strict Privacy mode</strong> is on by default: vacancy
            description text is excluded from AI payloads
          </li>
          <li>
            Contacts (emails, phones, URLs) are redacted before any external
            request
          </li>
          <li>You can fully disable AI at any time in Settings</li>
        </ul>
      </div>

      {/* ── n8n ── */}
      <div style={card}>
        <h3 style={cardHeading}>How n8n Integration Works</h3>
        <ul style={listStyle}>
          <li>
            n8n is <strong>opt-in</strong> and part of <strong>Labs</strong>{" "}
            (experimental features)
          </li>
          <li>
            It sends event notifications (e.g., &quot;vacancy saved&quot;,
            &quot;interview scheduled&quot;) to your own n8n webhook URL
          </li>
          <li>
            n8n is <strong>off by default</strong> — you must enable Labs and
            configure a webhook URL
          </li>
          <li>
            No data is sent until you configure and enable the integration
          </li>
        </ul>
      </div>

      {/* ── API keys warning ── */}
      <div
        style={{
          ...card,
          border: `1px solid ${colors.keyWarningBorder}`,
          background: colors.keyWarningBg,
        }}
      >
        <h3 style={{ ...cardHeading, color: colors.keyWarningText }}>
          ⚠ Important: API Key Security
        </h3>
        <p
          style={{
            fontSize: fontSizes.md,
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          API keys are stored locally in <code>chrome.storage.local</code> in
          plaintext. This is <strong>not a secure vault</strong>. Anyone with
          access to your unlocked computer and browser profile could read them.
          Use an API key with minimal permissions and consider a dedicated key
          for VacancyPilot.
        </p>
      </div>

      {/* ── Labs off by default ── */}
      <div style={card}>
        <h3 style={cardHeading}>Labs: Experimental Features</h3>
        <p
          style={{
            fontSize: fontSizes.md,
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          Labs features (n8n, guided apply) are <strong>off by default</strong>{" "}
          and not required for core functionality. You can ignore Labs
          completely. Core features — parsing, scoring, tracking, cover letters,
          and export — work without Labs.
        </p>
      </div>

      {/* ── Getting started steps ── */}
      <div style={card}>
        <h3 style={cardHeading}>Quick Setup (optional)</h3>
        <p
          style={{
            fontSize: fontSizes.md,
            color: colors.textPlaceholder,
            margin: "0 0 10px",
          }}
        >
          These steps help scoring work better. You can skip them and return
          later.
        </p>
        <h4 style={stepHeading}>1. Create a Profile</h4>
        <p style={stepDesc}>
          Go to <strong>Profiles</strong> in the sidebar. Add your skills, role
          preferences, and experience level. The scoring engine uses this to
          evaluate vacancies.
        </p>
        <h4 style={stepHeading}>2. Add Resume Highlights</h4>
        <p style={stepDesc}>
          Go to <strong>Resumes</strong> in the sidebar. Add a brief summary of
          your experience. This helps AI generate targeted cover letters (if you
          enable AI).
        </p>
        <h4 style={stepHeading}>3. Configure AI Provider (optional)</h4>
        <p style={stepDesc}>
          Go to <strong>Settings</strong> → AI. Enter your API key and select a
          provider. AI analysis and cover letter generation require this step.
        </p>
        <h4 style={stepHeading}>4. Configure n8n (optional, Labs)</h4>
        <p style={stepDesc}>
          Go to <strong>Labs</strong>. Enable Labs, then configure your n8n
          webhook URL in Settings → n8n. Skip this if you don&apos;t use n8n.
        </p>
      </div>

      {/* ── Complete button ── */}
      <form onSubmit={handleComplete}>
        <button type="submit" disabled={saving} style={primaryButton}>
          {saving ? "Saving…" : "Got it — Start Using VacancyPilot"}
        </button>
      </form>
    </div>
  );
}
