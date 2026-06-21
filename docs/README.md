# Documentation

## Project Overview

VacancyPilot is a **local-first, read-first HH.ru job-search copilot**. It runs as a Chrome Extension (Manifest V3) and helps candidates analyze vacancies, score opportunities, generate cover letters, and track their job search — all without risking their HH.ru account.

- **Status**: Private alpha / dogfooding
- **Stack**: WXT, TypeScript, React, Dexie (IndexedDB), chrome.storage.local
- **License**: Not selected yet

---

## Product Specification

- [`Техническое заданиеV.1.md`](Техническое%20заданиеV.1.md) — master specification v1.1 FINAL. Defines architecture, data model, permissions, scoring model, AI module, cover letter studio, security, testing plan, and acceptance criteria.

---

## Development

- [`development/00-product-development-plan.md`](development/00-product-development-plan.md) — product development plan, phase gates, and current implementation status
- [`development/01-epics.md`](development/01-epics.md) — epic breakdown
- [`development/02-iteration-map.md`](development/02-iteration-map.md) — iteration tracking and status
- [`development/03-autopilot-workflow.md`](development/03-autopilot-workflow.md) — Cursor/Codex/Zed autopilot workflow
- [`development/04-zed-deepseek-workflow.md`](development/04-zed-deepseek-workflow.md) — Zed-specific workflow rules
- [`development/README.md`](development/README.md) — development pack entry point
- [`development/private-install-guide.md`](development/private-install-guide.md) — how to build and load the extension locally
- [`development/qa-checklist.md`](development/qa-checklist.md) — manual QA checklist
- [`development/release-checklist.md`](development/release-checklist.md) — release readiness checklist

### Epics and Iterations

- [`development/epics/`](development/epics/) — epic definitions
- [`development/iterations/`](development/iterations/) — iteration definitions
- [`development/prompts/`](development/prompts/) — autopilot implementation prompts

---

## Security and Infrastructure

- [`SECURITY.md`](../SECURITY.md) — security policy, reporting, and forbidden patterns
- [`development/github-security-settings.md`](development/github-security-settings.md) — GitHub repository security configuration
- [`development/github-infra-final-hardening-report.md`](development/github-infra-final-hardening-report.md) — infrastructure hardening report
- [`development/github-infra-oauth-audit-report.md`](development/github-infra-oauth-audit-report.md) — OAuth/permission audit report
- [`development/security-alert-triage-report.md`](development/security-alert-triage-report.md) — dependency security alert triage
- [`development/sonarqube-cloud-setup.md`](development/sonarqube-cloud-setup.md) — SonarQube Cloud setup (advisory mode)
- [`../PRIVACY.md`](../PRIVACY.md) — current public-facing privacy policy draft
- [`development/privacy-policy-checklist.md`](development/privacy-policy-checklist.md) — privacy policy readiness checklist
- [`development/public-release-prerequisites.md`](development/public-release-prerequisites.md) — requirements before public release

---

## QA Reports

- [`development/manual-qa-run-2026-06-20.md`](development/manual-qa-run-2026-06-20.md) — manual QA run report
- [`development/ITER-022-triage-report.md`](development/ITER-022-triage-report.md) — triage report for parser issues
- [`development/ITER-027-triage-report.md`](development/ITER-027-triage-report.md) — triage report for dashboard issues
- [`development/phase-2-start-gate.md`](development/phase-2-start-gate.md) — Phase 2 gate check

---

## Audits

- [`vacancypilot_deep_repo_audit_2026-06-20.md`](vacancypilot_deep_repo_audit_2026-06-20.md) — deep repository audit
- [`vacancypilot_deep_repo_audit_b9d114c_2026-06-20.md`](vacancypilot_deep_repo_audit_b9d114c_2026-06-20.md) — follow-up audit
- [`development/audit-2026-06-21-decision-report.md`](development/audit-2026-06-21-decision-report.md) — audit decision report

### External Model Audits

- [`search/`](search/) — audits and recommendations from external models (retained as source material; the master specification is the source of truth)

---

## Roadmap and Backlog

- [`ROADMAP.md`](ROADMAP.md) — current status, near-term priorities, pre-public-beta checklist, non-goals
- [`development/known-risks.md`](development/known-risks.md) — known technical and product risks

---

## How to Read This Repo

| If you want to… | Start here |
|-----------------|-----------|
| Understand what this project is | [`README.md`](../README.md) |
| Read the full technical specification | [`Техническое заданиеV.1.md`](Техническое%20заданиеV.1.md) |
| Understand development status and process | [`development/README.md`](development/README.md) |
| Set up a local dev environment | [`development/private-install-guide.md`](development/private-install-guide.md) |
| Review security posture | [`SECURITY.md`](../SECURITY.md) |
| See what's planned next | [`ROADMAP.md`](ROADMAP.md) |
| Report a security issue | [GitHub Security Advisory](https://github.com/VacancyPilot/VacancyPilot/security/advisories/new) |
