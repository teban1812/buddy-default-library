---
lifecycle: evergreen
set: general
---
# Design standards

The library's design rules, whatever the stack. They are **evergreen**, like the general standards: the library owns them and the project keeps the version it pinned. Dev builds to them, the independent reviewer checks them, the usability audit measures against them and discovery reads them before the wireframes, exactly as any other standard (`must` is fixed, `prefer` is the default, `free` is the builder's choice). A profile may add its own `design.md` for what is specific to its stack. The theme the owner chooses is a separate matter: these rules hold for whichever theme it is.

The accessibility rules follow WCAG 2.2 level AA; the criterion each one comes from is named in its row. A program checks what it can (axe, in the template's tests); the rest is the reviewer's, on the screen.

Confirmed by the Standards Owner on 2026-11-25 (DSN-1 to DSN-8); DSN-9 to DSN-15 and the prototype rules added and confirmed the same day, from the rules an enterprise library had already drawn from its prototyping workshop and a real discovery.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| DSN-1 | must | Contrast: text has at least 4.5:1 against its background (3:1 for large text), and controls, their states and borders at least 3:1, in light and in dark mode (WCAG 1.4.3, 1.4.11). | reviewer, on the screen (axe in the template's tests cannot check contrast: jsdom does not compute colours); program: axe where a real browser runs | text and controls people cannot read, above all in dark mode or in sunlight |
| DSN-2 | must | Keyboard: everything that can be done with a mouse can be done with the keyboard, in a logical order, the focus is always visible and nothing traps it (WCAG 2.1.1, 2.1.2, 2.4.3, 2.4.7). | program: axe in the tests (names, roles, focusable elements); reviewer, by tabbing through | people who cannot use a mouse stopped at a button they cannot reach or cannot see |
| DSN-3 | must | Forms: every field has a label; an error says what happened and how to fix it, next to the field, and keeps what was typed (WCAG 1.3.1, 3.3.1, 3.3.3, 3.3.2). | reviewer | a form that fails without saying why, or that empties itself after a mistake |
| DSN-4 | must | Target size: what is clicked or tapped is at least 24 by 24 CSS pixels (WCAG 2.5.8). | reviewer | controls too small to hit, on a touch screen or with a tremor |
| DSN-5 | must | Reflow: no content or function is lost at 320 pixels of width or at 200% zoom, and the motion that is not essential stops when the person asks for reduced motion (WCAG 1.4.10, 2.3.3). | reviewer | cut-off or hidden content on a phone or for a person who zooms; animation that makes people ill |
| DSN-6 | prefer | Colours come only from the theme's tokens, never a literal colour in a component, so that changing the theme changes everything. | program: where the project has such a check; reviewer | a theme change that leaves screens in the old colours |
| DSN-7 | prefer | States and feedback: each screen has its loading, empty and error states designed; every action shows its result; a destructive action asks for confirmation or can be undone. | reviewer | a blank screen nobody understands, an action that may or may not have worked, data lost by one click |
| DSN-8 | prefer | Consistency: one term per concept, the glossary's; the same action in the same place on every screen. | reviewer | people relearning the application at each screen |
| DSN-9 | must | Colour is never the only signal: a state always shows its text (a dot or an icon beside it is decorative), and a red border without words is not an error (WCAG 1.4.1). | reviewer | a state people with colour blindness cannot tell apart |
| DSN-10 | prefer | The five states of a screen with data, each one reachable in the prototype: with data at realistic volume; empty (first use and "nothing matches these filters" are different texts, one action, none for a role that cannot create); loading (the content's own shape, `aria-busy`); error (says what failed and offers a retry, never only a passing message); read-only (the same screen without the actions the role cannot use, with a notice). Header, filters and footer stay in place in every state. | reviewer | states the builder has to invent, and a read-only role that meets dead buttons |
| DSN-11 | prefer | Actions: one primary action per screen; a disabled control says why next to it; an action that takes time disables its button and shows progress, so a second click never creates a second record; the destructive action is set apart from the primary, outlined rather than solid, and asks for a confirmation whose title names the object, with Cancel focused first. | reviewer | indecisive screens, double submissions, data deleted by a click on the wrong button |
| DSN-12 | must | Dialogs: modal (the page behind is inert and focus stays inside), one at a time, never a step of navigation; `Escape` closes and returns focus to what opened it; one with unsaved input confirms before discarding; a confirmation before a submission that cannot be undone shows what is being submitted (WCAG 2.1.2, 2.4.3, 3.3.4). | reviewer | focus lost behind a dialog, work discarded by a key, a submission confirmed without seeing it |
| DSN-13 | prefer | Navigation in one of two shapes, chosen with the owner when the wireframes start and kept on every screen: a side navigation on the left (the default with more than five destinations or sections) or a top bar only. The theme's `--sidebar-*` variables colour the navigation in either shape. The user's name and sign-out travel together, sign-out is never in the danger colour, and below 768 pixels the links collapse, never the user's name and exit. | reviewer | a navigation that changes shape between screens, a theme drawn for one shape only |
| DSN-14 | prefer | Tables: a real `table` with header cells; sortable columns expose their sort (`aria-sort`); numbers formatted for the person's language with fixed-width figures, one date format across the application; a raw value never reaches the person (an enum name, an ISO timestamp, an id, `null`). | reviewer | tables screen readers cannot follow, and figures nobody can compare |
| DSN-15 | prefer | Fonts are the system's or embedded in the theme with a licence that allows it, never loaded from an external service. | reviewer | a screen that changes letters offline, or that calls a third party on every visit |

## Prototypes

What discovery draws before anything is built; nothing here reaches the application.

| Id | Zone | Rule | Checked by | Prevents |
| :-- | :-- | :-- | :-- | :-- |
| DSN-P1 | must | Sample data is believable and marked as an example, never a real person's: at least 40 rows in a list, one name of the length the domain really produces, one record with every optional field empty and one full, a person with no data and a way to show the error state. | reviewer | three short rows that hide density, truncation and wrapping problems until the product is built |
| DSN-P2 | must | At least two roles: one that creates and edits, one that mostly reads and sees each screen it may open, complete, without the actions it cannot use. | reviewer | a read-only experience nobody designed |
| DSN-P3 | must | What exists only so the prototype runs on its own (a role switcher, demo data, simulated jobs) is outside the application's frame and labelled as the prototype's, so it is never mistaken for a requirement. | reviewer | scaffolding built into the product |
