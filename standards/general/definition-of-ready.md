---
lifecycle: evergreen
set: general
---
# Definition of Ready

What a change needs before it is made ready to build, whatever the project's stack. Buddy weighs a change against these rules while it refines, as he weighs the standards, and names to the Product Owner each rule it does not meet, with what it needs, before he makes it ready. They add to Buddy's own ready rule (criteria, what the change leaves out, how each criterion is tried, no blocking question open), which holds whatever a library says. They are **evergreen**, like the general standards: the library owns them and the project keeps the version it pinned. A profile adds its own in `standards/<profile>/definition-of-ready.md`; the rules of the chosen profile add to these. A project that must depart from one records that as its own decision.

Not yet confirmed by a Standards Owner.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| DOR-1 | must | The change has at least one acceptance criterion in business words, and says what it does not include. | program: Buddy's ready rule; Buddy, while the change refines | a change nobody can accept, and one that grows while it is built |
| DOR-2 | must | Each criterion says how it will be tried, written before the build. | program: Buddy's ready rule; Buddy, while the change refines | a criterion that is only checked once the work is done, the way the work happened to turn out |
| DOR-3 | must | A criterion that speaks of money, dates or calculations carries an example with numbers. | Buddy, while the change refines | a price, a date or a total built on a reading nobody confirmed |
| DOR-4 | must | No blocking question is open, and the assumptions are announced to the Product Owner. | program: Buddy's ready rule; Buddy, while the change refines | building on a guess the Product Owner would have corrected |
| DOR-5 | must | Where the data each criterion asks for comes from is known (a record, a table, a service, a permission, a business fact). | Buddy, while the change refines | a build that stops halfway because the data it needs does not exist |
