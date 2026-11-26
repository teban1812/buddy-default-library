---
lifecycle: evergreen
set: dotnet-react
---
# Quality goals: .NET + React

The quality goals the library proposes for a .NET + React application, on top of the general ones (`standards/general/quality-goals.md`), which say what a goal is and how the project confirms it. Like those, each is a **proposal**, never a rule, and the library keeps them up to date.

Not yet confirmed by a Standards Owner.

| Id | Zone | Goal | Target | Measured by |
| :-- | :-- | :-- | :-- | :-- |
| QG-DR-1 | proposal | People using it at the same time | up to 50 | a load test of the main screens with 50 people at once, before UAT |
| QG-DR-2 | proposal | Time a page takes to answer | 95 % of pages in under 2 seconds | the same load test, timing each page; UAT on the main screens |
| QG-DR-3 | proposal | Time it may be down | at most 4 hours a month, outside office hours | the hosting's availability report over a month in use |
