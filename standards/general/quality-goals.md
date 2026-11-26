---
lifecycle: evergreen
set: general
---
# Quality goals

The quality goals the library proposes to every project, whatever its stack, so UAT has something to measure. They are **evergreen**, like the general standards: the library owns them and the project keeps the version it pinned. A profile adds its own in `standards/<profile>/quality-goals.md`; the goals of the chosen profile add to these.

They are not rules. Each one is a **proposal**: Buddy brings those the project's risk justifies, five at most, adjusted to what the owner or the PRD says, and the owner confirms or corrects each. Only what the owner confirms binds the project, written in the "Quality goals" section of its `docs/context.md`, citing the id it comes from. Each goal has a target that can be measured (a number or a list) and says how it is measured; measuring it is UAT's and the project's checks', not Buddy's.

Not yet confirmed by a Standards Owner.

| Id | Zone | Goal | Target | Measured by |
| :-- | :-- | :-- | :-- | :-- |
| QG-1 | proposal | How long its data is kept | 5 years, then deleted or archived | the project's data retention, read in UAT against the oldest records |
| QG-2 | proposal | Accessibility | WCAG 2.2 AA on every screen | program: the template's axe tests, where it has them; the usability audit and UAT, on each screen |
