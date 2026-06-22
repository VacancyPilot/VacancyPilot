import { useCallback, useEffect, useState, type ReactNode } from "react";
import { loadSettings, saveSettings } from "@/db/settings-bridge";
import type { AppSettings } from "@/models/settings";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import {
  card,
  cardHeading,
  colors,
  fontSizes,
  sectionDesc,
  sectionHeading,
} from "@/styles";

type RejectedSearchCardBehavior =
  AppSettings["general"]["rejectedSearchCardBehavior"];

export function SearchHighlightsSection(): ReactNode {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectedBehavior, setRejectedBehavior] =
    useState<RejectedSearchCardBehavior>("dim");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const settings = await loadSettings();
      setRejectedBehavior(settings.general.rejectedSearchCardBehavior);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistRejectedBehavior = useCallback(
    async (nextBehavior: RejectedSearchCardBehavior) => {
      setSaving(true);
      setError(null);
      try {
        const settings = await loadSettings();
        settings.general.rejectedSearchCardBehavior = nextBehavior;
        await saveSettings(settings);
        setRejectedBehavior(nextBehavior);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to update search highlights",
        );
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <ErrorState
        message="Failed to load search highlight settings"
        details={error}
        onRetry={() => {
          setError(null);
          void load();
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 620 }}>
      <h2 style={sectionHeading}>Search Highlights</h2>
      <p style={sectionDesc}>
        Local job data and visit marks are used to annotate HH search cards.
        Rejected cards can be dimmed or hidden without changing any HH
        controls.
      </p>

      <div style={card}>
        <h3 style={cardHeading}>Rejected card behavior</h3>
        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textFaint,
            margin: "0 0 12px",
          }}
        >
          Choose how cards with rejected status should appear on the search
          page.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="rejected-search-card-behavior"
              checked={rejectedBehavior === "dim"}
              onChange={() => void persistRejectedBehavior("dim")}
              disabled={saving}
            />
            <span>Dim rejected cards</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="radio"
              name="rejected-search-card-behavior"
              checked={rejectedBehavior === "hide"}
              onChange={() => void persistRejectedBehavior("hide")}
              disabled={saving}
            />
            <span>Hide rejected cards</span>
          </label>
        </div>

        <p
          style={{
            fontSize: fontSizes.sm,
            color: colors.textSecondary,
            margin: 0,
          }}
        >
          The setting is stored locally and applies on the next search-page
          refresh.
        </p>
      </div>
    </div>
  );
}
