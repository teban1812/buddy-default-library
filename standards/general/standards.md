---
lifecycle: evergreen
set: general
---
# General standards

The standards every project built with Buddy follows, whatever its stack. They are **evergreen**: the library owns them, the project keeps the version it pinned, and when the library publishes a new version the project is told what changed and its Standards Owner decides whether to move to it.

Each rule says how much freedom it leaves (`must` is fixed unless the Product Owner departs from it with an ADR that says why and names the rule, and the board and the digest list each such departure for the Standards Owner to review afterwards, without stopping the work; `prefer` is the default and a deviation is recorded as a decision; `free` is the builder's choice), how it is checked (a program first, then the independent reviewer, `declared` last) and the problem it prevents. A rule that cannot say these does not belong here. In an existing project, the rules bind the code a change writes; code that is not touched is not forced to follow them.

Confirmed by the Standards Owner on 2026-11-01 (PRP-1 and CRF-1 to CRF-3 added and confirmed the same day). PRP-1 keeps the work in proportion to the project's risk; the CRF rules are craft, not over-engineering: they name the kinds of failure an experienced builder suspects (the data, a change, a failure, the people), not a list of cases. A case seen again and again in a project may be promoted by its Standards Owner into a rule of that project or of an enterprise library.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| QLT-1 | must | Every change of behaviour comes with tests. | program: the checkpoint's scan; reviewer | behaviour nobody can prove still works |
| QLT-2 | must | The project's `validate` command passes before a slice is delivered. | program: the checkpoint | handing over work that does not build or pass its tests |
| QLT-3 | must | A test is never removed, skipped or weakened to make the build pass. | program: the checkpoint's scan; reviewer | a green build that hides a failure |
| QLT-4 | must | Test data is invented, and what is generated comes from a fixed seed, so every run gives the same data; no real person's data (a name, an email, an address, a document number) is used in tests, fixtures or seeds. Invented emails use a reserved domain (`example.com`) and invented network addresses a documentation range (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`). | reviewer; program: the personal-data scan, once it exists | tests that fail at random because their data changes, and people's data leaked through the repository |
| DEP-1 | must | A new dependency is asked of the Product Owner first, with what it costs and what it brings. | program: the scan flags package files | supply-chain and licence risk, and weight nobody chose |
| SEC-1 | must | No secret in the repository: configuration comes from the environment or a secrets store. | program: gitleaks with the project's .gitleaks.toml, before each commit and in CI; reviewer | credentials leaked through git |
| SEC-2 | must | Input from users is validated where it enters the system. | program: the project's Semgrep rules where a pattern applies (SQL or HTML built from text), once per change and in CI; reviewer | invalid or malicious data reaching the business logic |
| GIT-1 | must | Commits follow Conventional Commits. | program: the commit check | a history nobody can read or release from |
| PRP-1 | must | Build only what the change's criteria, the Product Owner's answers and the project's risk appetite require; a case nobody asked for is raised as a question, not built. | independent reviewer: lists the decisions nobody specified | complexity nobody needs, built because it was possible |
| CRF-1 | must | Nothing fails silently: no data is cut, lost or corrupted without the user knowing, and when something fails the user sees what happened and what to do. | program: a Semgrep rule for empty catches, once per change and in CI; reviewer | a truncated list, a save that did not save, a failure only a log knows about |
| CRF-2 | must | What already works keeps working: changing or reusing existing code is proven for those who already used it and for the new use. | program: validate and the scan of edited tests; reviewer | a reused method that breaks another screen |
| CRF-3 | must | Usable without instructions: every screen lets the person who really uses it do its main task, with the information they need in sight and no dead ends. | reviewer, against the prototype | an application nobody can use |
| FREE-1 | free | Internal structure inside a feature, private names, and the order of the work within a slice. | — | asking about what does not matter |
