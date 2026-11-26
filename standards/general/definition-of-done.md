---
lifecycle: evergreen
set: general
---
# Definition of Done

What a change must meet before it is delivered to the Product Owner, whatever the project's stack. The independent reviewer checks every rule at the checkpoint and reports each one not met as a finding; the programs check first what they can. They are **evergreen**, like the general standards: the library owns them and the project keeps the version it pinned. A profile adds its own in `standards/<profile>/definition-of-done.md`; the rules of the chosen profile add to these. A project that must depart from one records that as its own decision.

Not yet confirmed by a Standards Owner.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| DOD-1 | must | Each acceptance criterion is met, and each key example in a criterion has its test. | reviewer, at the checkpoint | delivering a change that does not do what was accepted |
| DOD-2 | must | All tests pass, and none was removed or weakened. | program: the checkpoint's validate and its scan; reviewer | a green build that hides a failure |
| DOD-3 | must | The security check found nothing: no secrets and no personal data in the repository. | program: gitleaks, before each commit and in CI; reviewer | credentials or people's data leaked through git |
| DOD-4 | must | The documentation the change made stale is up to date in the same change. | reviewer, at the checkpoint | documentation that describes an application that no longer exists |
| DOD-5 | must | If the change has screens, they pass the accessibility check and follow the prototype, or each departure is approved by the Product Owner. | program: the template's accessibility tests, where it has them; reviewer, against the prototype | screens some people cannot use, and screens that are not what the Product Owner saw |
