## Summary

<!-- Briefly describe the change and why. -->

## Scope

- [ ] Parser / adapter
- [ ] Content script
- [ ] UI component (React)
- [ ] Database / storage
- [ ] Scoring / AI
- [ ] Settings / permissions
- [ ] Tests / fixtures
- [ ] CI / tooling
- [ ] Docs

## Safety Checklist

- [ ] No auto-submit behavior
- [ ] No auto-click on HH controls
- [ ] No programmatic writes to HH form fields
- [ ] No hidden fetch/XHR to HH endpoints
- [ ] No cookies or HH session handling
- [ ] No new broad permissions added
- [ ] No developer telemetry by default

## Validation

- [ ] `pnpm typecheck` — passes
- [ ] `pnpm lint` — passes
- [ ] `pnpm test` — passes
- [ ] `pnpm build` — succeeds
- [ ] `pnpm test:release` — passes
- [ ] Manual Chrome test — done
- [ ] Manual Edge test — done
