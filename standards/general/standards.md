---
lifecycle: evergreen
set: general
---
# General standards

The standards every project built with Buddy follows, whatever its stack. They are **evergreen**: the library owns them, the project keeps the version it pinned, and when the library publishes a new version the project is told what changed and its Standards Owner decides whether to move to it. A project that must depart from one records that as its own decision.

Each rule says how much freedom it leaves (`must` is fixed and a deviation needs the Standards Owner's decision; `prefer` is the default and a deviation is recorded as a decision; `free` is the builder's choice), how it is checked (a program first, then the independent reviewer, `declared` last) and the problem it prevents. A rule that cannot say these does not belong here. In an existing project, the rules bind the code a change writes; code that is not touched is not forced to follow them.

Confirmed by the Standards Owner on 2026-11-01.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| QLT-1 | must | Every change of behaviour comes with tests. | program: the checkpoint's scan; reviewer | behaviour nobody can prove still works |
| QLT-2 | must | The project's `validate` command passes before a slice is delivered. | program: the checkpoint | handing over work that does not build or pass its tests |
| QLT-3 | must | A test is never removed, skipped or weakened to make the build pass. | program: the checkpoint's scan; reviewer | a green build that hides a failure |
| DEP-1 | must | A new dependency is asked of the Product Owner first, with what it costs and what it brings. | program: the scan flags package files | supply-chain and licence risk, and weight nobody chose |
| SEC-1 | must | No secret in the repository: configuration comes from the environment or a secrets store. | program: a secret scanner when installed; reviewer | credentials leaked through git |
| SEC-2 | must | Input from users is validated where it enters the system. | reviewer | invalid or malicious data reaching the business logic |
| GIT-1 | must | Commits follow Conventional Commits. | program: the commit check | a history nobody can read or release from |
| FREE-1 | free | Internal structure inside a feature, private names, and the order of the work within a slice. | — | asking about what does not matter |
