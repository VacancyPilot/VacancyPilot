# License and Community Governance Decision

**Date**: 2026-06-21
**Status**: Decision pending — owner action required

---

## Current State

The repository `VacancyPilot/VacancyPilot` is **public** but has **no license file**. Under copyright law, this means **all rights are reserved by default**. No one may use, modify, or distribute the code without explicit permission from the copyright holder.

The README correctly states: *"License: not selected yet. Until a license is added, all rights are reserved by default."*

---

## License Options

### MIT

- **What it allows**: anyone can use, modify, distribute, sublicense the code — including for commercial use
- **Obligations**: include the original copyright notice and license text
- **Best for**: open-source demos, portfolio projects, community-driven tools where wide adoption is the goal
- **Risk**: competitors can legally fork and commercialize

### Apache 2.0

- **What it allows**: similar to MIT, plus explicit patent grant and contribution terms
- **Obligations**: include license, state changes made, retain NOTICE file if present
- **Best for**: projects that want patent protection alongside permissive use
- **Risk**: same as MIT — permissive for commercial use

### GPL / AGPL

- **What it allows**: use, modify, distribute — but derivative works must also be open-source under the same license
- **Obligations**: copyleft — share source of modifications
- **Best for**: ensuring all forks and improvements remain open
- **Risk**: may deter commercial adoption or enterprise use

### Source-Available / All Rights Reserved (current state)

- **What it allows**: viewing the code, but no use/modification/distribution rights
- **Best for**: showcasing work without granting usage rights; pre-commercial phase
- **Risk**: limits community contributions; unclear legal status for casual forks

---

## Recommendation

| Scenario | Recommended License |
|----------|-------------------|
| Personal portfolio / open-source demo | MIT or Apache-2.0 |
| Product may become commercial | Delay license decision, or use explicit source-available terms after legal review |
| Strong community-driven FOSS | GPL (copyleft) or AGPL (network copyleft) |

**Current recommendation for private alpha**: keep "all rights reserved" until the product direction is clear. Revisit before public beta.

---

## Code of Conduct

A `CODE_OF_CONDUCT.md` is **not yet added**. This is intentional — the project is a single-maintainer private alpha with no external community.

### When to Add

Add a Code of Conduct when:

1. External contributors start opening pull requests
2. A community discussion space (Discussions, Discord, forum) is opened
3. The project is promoted for external collaboration

### Recommended

If and when a Code of Conduct is added, the **Contributor Covenant** (v2.1) is the industry standard:

- Website: https://www.contributor-covenant.org/
- GitHub often suggests this during community profile setup

### Decision

- [ ] Add `CODE_OF_CONDUCT.md` now
- [ ] Defer until external community forms ← **current recommendation**
- [ ] Not needed — single-maintainer project indefinitely
