import type React from "react";
import { colors, fontSizes, fontWeights, spacing, borderRadius } from "./tokens";

/**
 * Shared form layout helpers.
 * Use these to reduce one-off inline styles and improve
 * responsive form behaviour across the dashboard.
 *
 * Rules from audit P1-03:
 * - single column below 720px;
 * - 2 columns only above 720px (via media query or explicit layout);
 * - inputs must have min-width: 0;
 * - textarea min-height 96px;
 * - buttons wrap.
 */

// ── Form container ──

/** Max-width wrapper for form sections. */
export const formContainer: React.CSSProperties = {
  maxWidth: 600,
};

// ── Form rows ──

/** Full-width form row. */
export const formRow: React.CSSProperties = {
  marginBottom: spacing.xl,
};

/** Two-column form row layout (wraps to single column below 720px). */
export const formGridTwoColumn: React.CSSProperties = {
  display: "flex",
  gap: spacing.xl,
  flexWrap: "wrap",
};

/** Single grid column in a two-column layout. */
export const formGridColumn: React.CSSProperties = {
  flex: "1 1 260px",
  minWidth: 0,
};

// ── Labels and hints ──

/** Standard form label. */
export const formLabel: React.CSSProperties = {
  display: "block",
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.semibold,
  color: colors.textMuted,
  marginBottom: spacing.xs3,
};

/** Disabled form label (muted, not transparent). */
export const formLabelDisabled: React.CSSProperties = {
  ...formLabel,
  color: colors.textFaint,
};

/** Hint / description below a label. */
export const formHint: React.CSSProperties = {
  fontSize: fontSizes.sm,
  color: colors.textPlaceholder,
  marginBottom: spacing.xs,
};

/** Disabled hint. */
export const formHintDisabled: React.CSSProperties = {
  ...formHint,
  color: colors.textVeryFaint,
};

// ── Inputs ──

/** Shared text/number input style. */
export const formInput: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: `${spacing.xs}px ${spacing.sm}px`,
  fontSize: fontSizes.md,
  border: `1px solid ${colors.borderLight}`,
  borderRadius: borderRadius.sm,
  color: colors.text,
  boxSizing: "border-box",
};

/** Disabled input style. */
export const formInputDisabled: React.CSSProperties = {
  ...formInput,
  background: colors.neutralBg,
  color: colors.textFaint,
  cursor: "not-allowed",
};

/** Shared select style. */
export const formSelect: React.CSSProperties = {
  ...formInput,
  background: colors.white,
};

/** Disabled select style. */
export const formSelectDisabled: React.CSSProperties = {
  ...formSelect,
  background: colors.neutralBg,
  color: colors.textFaint,
  cursor: "not-allowed",
};

/** Textarea style. */
export const formTextarea: React.CSSProperties = {
  ...formInput,
  minHeight: 96,
  resize: "vertical",
};

/** Disabled textarea style. */
export const formTextareaDisabled: React.CSSProperties = {
  ...formTextarea,
  background: colors.neutralBg,
  color: colors.textFaint,
  cursor: "not-allowed",
};

// ── Checkbox ──

/** Checkbox label row. */
export const formCheckboxLabel: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: spacing.xs,
  fontSize: fontSizes.md,
  cursor: "pointer",
};

// ── Action row ──

/** Form action buttons row. */
export const formActions: React.CSSProperties = {
  display: "flex",
  gap: spacing.sm,
  flexWrap: "wrap",
  marginTop: spacing.lg,
};

// ── Section ──

/** Row with label + control (used in settings/sections). */
export const formSettingsRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${spacing.lg}px 0`,
  borderBottom: `1px solid ${colors.borderHairline}`,
};

/** Disabled settings row (no opacity, explicit muted colors). */
export const formSettingsRowDisabled: React.CSSProperties = {
  ...formSettingsRow,
  color: colors.textFaint,
};
