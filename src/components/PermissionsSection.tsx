import { useEffect, useState, type ReactNode } from "react";
import {
  sectionHeading,
  sectionDesc,
  card,
  cardHeading,
  listStyle,
  tableStyle,
  thStyle,
  tdStyle,
  grantedBadge,
  colors,
  fontSizes,
} from "@/styles";

interface PermissionInfo {
  permission: string;
  status: "granted" | "optional";
  feature: string;
  reason: string;
}

function buildDeclaredPermissions(): PermissionInfo[] {
  return [
    {
      permission: "storage",
      status: "granted",
      feature: "Local settings and saved data",
      reason:
        "Stores profiles, vacancy history, privacy settings, and local extension state in your browser.",
    },
    {
      permission: "sidePanel",
      status: "granted",
      feature: "Vacancy side panel",
      reason:
        "Opens VacancyPilot in the browser side panel so analysis and tracking stay next to the HH page you are viewing.",
    },
    {
      permission: "activeTab",
      status: "granted",
      feature: "Read current vacancy tab",
      reason:
        "Reads the currently active HH vacancy tab when you use the extension on that page. It does not grant background access to all sites.",
    },
  ];
}

export function PermissionsSection(): ReactNode {
  const [permissions, setPermissions] = useState<PermissionInfo[]>(
    buildDeclaredPermissions(),
  );
  const [optionalOriginGranted, setOptionalOriginGranted] = useState(false);

  useEffect(() => {
    try {
      const manifest = chrome.runtime.getManifest();
      const declared = manifest.permissions ?? [];
      const known = buildDeclaredPermissions();
      const visible = known.filter((permission) =>
        declared.includes(permission.permission),
      );

      if (visible.length > 0) {
        setPermissions(visible);
      }

      const permissionsApi = chrome.permissions;
      if (permissionsApi?.contains) {
        void permissionsApi
          .contains({ origins: ["https://api.openai.com/*"] })
          .then(setOptionalOriginGranted)
          .catch(() => setOptionalOriginGranted(false));
      }
    } catch {
      setPermissions(buildDeclaredPermissions());
    }
  }, []);

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 style={sectionHeading}>Permissions &amp; Data Access</h2>
      <p style={sectionDesc}>
        VacancyPilot keeps the permission surface narrow. The current manifest
        requests only the permissions listed below.
      </p>

      <div style={card}>
        <h3 style={cardHeading}>Declared Manifest Permissions</h3>
        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textFaint,
            margin: "0 0 4px",
          }}
        >
          These permissions are part of the installed extension package. There
          are no declared host permissions in the current build.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Permission</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Used for</th>
              <th style={thStyle}>Why</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((permission) => (
              <tr key={permission.permission}>
                <td style={tdStyle}>
                  <code style={{ fontSize: fontSizes.sm }}>
                    {permission.permission}
                  </code>
                </td>
                <td style={tdStyle}>
                  <span style={grantedBadge}>Granted</span>
                </td>
                <td style={tdStyle}>{permission.feature}</td>
                <td style={{ ...tdStyle, color: colors.textSecondary }}>
                  {permission.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>Optional Runtime Host Access</h3>
        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textFaint,
            margin: "0 0 8px",
          }}
        >
          OpenAI access is declared as an optional host permission and is
          requested only when you confirm an AI action that needs it.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Origin</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Used for</th>
              <th style={thStyle}>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tdStyle}>
                <code style={{ fontSize: fontSizes.sm }}>
                  https://api.openai.com/*
                </code>
              </td>
              <td style={tdStyle}>
                <span style={grantedBadge}>
                  {optionalOriginGranted ? "Granted" : "Not granted"}
                </span>
              </td>
              <td style={tdStyle}>OpenAI requests by explicit user action</td>
              <td style={{ ...tdStyle, color: colors.textSecondary }}>
                Needed only when you confirm an AI draft or analysis request.
                VacancyPilot does not request this access at install time.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>What Is Not Requested</h3>
        <ul style={listStyle}>
          <li>No install-time host permissions such as `https://hh.ru/*`.</li>
          <li>No optional permissions such as `clipboardWrite` or `alarms`.</li>
          <li>
            No install-time API host permissions for OpenAI, DeepSeek,
            OpenRouter, or n8n.
          </li>
        </ul>
        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textFaint,
            margin: "8px 0 0",
          }}
        >
          AI and n8n remain opt-in. Today only OpenAI is wired through an
          optional runtime host request. Other providers stay out of scope until
          implemented.
        </p>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>How to Revoke Access</h3>
        <ol style={listStyle}>
          <li>
            Open <code>chrome://extensions/</code> in your browser.
          </li>
          <li>
            Find <strong>VacancyPilot</strong>.
          </li>
          <li>
            Open <strong>Details</strong> to inspect the installed manifest.
          </li>
          <li>
            Disable or remove the extension to revoke all granted permissions.
          </li>
        </ol>
      </div>
    </div>
  );
}
