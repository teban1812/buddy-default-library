---
lifecycle: evergreen
set: general
---
# Design standards

The library's design rules, whatever the stack. They are **evergreen**, like the general standards: the library owns them and the project keeps the version it pinned. Dev builds to them, the independent reviewer checks them, the usability audit measures against them and discovery reads them before the wireframes, exactly as any other standard (`must` is fixed, `prefer` is the default, `free` is the builder's choice). A profile may add its own `design.md` for what is specific to its stack. The theme the owner chooses is a separate matter: these rules hold for whichever theme it is.

The accessibility rules follow WCAG 2.2 level AA; the criterion each one comes from is named in its row. A program checks what it can (axe, in the template's tests); the rest is the reviewer's, on the screen.

Confirmed by the Standards Owner on 2026-11-25.

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
