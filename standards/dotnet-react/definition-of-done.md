---
lifecycle: evergreen
set: dotnet-react
---
# Definition of Done: .NET + React

The Definition of Done of this profile, on top of the general one (`standards/general/definition-of-done.md`), which says when it is checked and how a rule not met is reported. Like that one, it is evergreen and the library keeps it up to date.

Not yet confirmed by a Standards Owner.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| DOD-DR-1 | must | Each screen the change adds or changes has an axe accessibility test under `web/src/`, in light and dark mode, and it passes. | program: the axe tests in validate; reviewer | a screen that passes because no accessibility test ever looked at it |
