import { useEffect, useState, type ReactNode } from "react";

const sectionHeading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  margin: "0 0 6px",
  color: "#1a3a5c",
};

const card: React.CSSProperties = {
  padding: 14,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  background: "#fafafa",
  marginBottom: 12,
  maxWidth: 560,
};

const cardHeading: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  margin: "0 0 6px",
  color: "#1a3a5c",
};

const permTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
  marginTop: 8,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "4px 8px",
  borderBottom: "1px solid #eee",
  fontWeight: 600,
  color: "#555",
};

const tdStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderBottom: "1px solid #f5f5f5",
  color: "#333",
  verticalAlign: "top",
};

const grantedBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "1px 6px",
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 600,
  background: "#e6f7e6",
  color: "#2a8",
};

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
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 14px" }}>
        VacancyPilot keeps the permission surface narrow. The current manifest
        requests only the permissions listed below.
      </p>

      <div style={card}>
        <h3 style={cardHeading}>Declared Manifest Permissions</h3>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 4px" }}>
          These permissions are part of the installed extension package. There
          are no declared host permissions in the current build.
        </p>
        <table style={permTable}>
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
                  <code style={{ fontSize: 11 }}>{permission.permission}</code>
                </td>
                <td style={tdStyle}>
                  <span style={grantedBadge}>Granted</span>
                </td>
                <td style={tdStyle}>{permission.feature}</td>
                <td style={{ ...tdStyle, color: "#555" }}>{permission.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>Optional Runtime Host Access</h3>
        <p style={{ fontSize: 11, color: "#888", margin: "0 0 8px" }}>
          OpenAI access is declared as an optional host permission and is
          requested only when you confirm an AI action that needs it.
        </p>
        <table style={permTable}>
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
                <code style={{ fontSize: 11 }}>https://api.openai.com/*</code>
              </td>
              <td style={tdStyle}>
                <span style={grantedBadge}>
                  {optionalOriginGranted ? "Granted" : "Not granted"}
                </span>
              </td>
              <td style={tdStyle}>OpenAI requests by explicit user action</td>
              <td style={{ ...tdStyle, color: "#555" }}>
                Needed only when you confirm an AI draft or analysis request.
                VacancyPilot does not request this access at install time.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>What Is Not Requested</h3>
        <ul
          style={{
            margin: "4px 0 0",
            paddingLeft: 18,
            fontSize: 12,
            color: "#555",
            lineHeight: 1.8,
          }}
        >
          <li>No install-time host permissions such as `https://hh.ru/*`.</li>
          <li>No optional permissions such as `clipboardWrite` or `alarms`.</li>
          <li>
            No install-time API host permissions for OpenAI, DeepSeek,
            OpenRouter, or n8n.
          </li>
        </ul>
        <p style={{ fontSize: 11, color: "#888", margin: "8px 0 0" }}>
          AI and n8n remain opt-in. Today only OpenAI is wired through an
          optional runtime host request. Other providers stay out of scope until
          implemented.
        </p>
      </div>

      <div style={card}>
        <h3 style={cardHeading}>How to Revoke Access</h3>
        <ol
          style={{
            margin: "4px 0 0",
            paddingLeft: 18,
            fontSize: 12,
            color: "#555",
            lineHeight: 1.8,
          }}
        >
          <li>
            Open <code>chrome://extensions/</code> in your browser.
          </li>
          <li>Find <strong>VacancyPilot</strong>.</li>
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
