# Brutalist Portfolio Redesign Design

**Date:** 2026-09-20
**Status:** Approved direction, pending written-spec review
**Project:** Barkah Istigozah Portfolio

## Intent

Redesign the existing portfolio into a restrained brutalist archive: precise, monochrome, typography-led, and fast on desktop, tablet, and mobile. The result should feel inspired by the supplied Institute for Ephemeral Media archive reference while remaining recognizably Barkah's portfolio rather than a copy of the fictional archive.

The current Indonesian content, content collections, routes, SEO metadata, and project-detail material remain the source of truth. The redesign changes presentation and interaction, not the factual portfolio content.

## Success Criteria

- The visual system uses white paper, black ink, neutral gray, one-pixel rules, square corners, and no shadows.
- The home page communicates identity, skills, selected work, writing, and contact without decorative card UI.
- Projects can be filtered and sorted as a keyboard-accessible archive index.
- A monochrome procedural Three.js canvas responds to the selected project without becoming a continuously running background effect.
- GSAP provides short, purposeful transitions while the page remains complete and usable without JavaScript.
- The layout works without horizontal scrolling at 375, 768, 1024, and 1440 CSS pixels.
- Motion is disabled or reduced when `prefers-reduced-motion` is enabled, including changes made while the page is open.
- Existing untracked brochure files are outside this redesign and remain untouched.

## Chosen Direction

Use a **Brutalist Portfolio Index** structure.

The reference archive's visual grammar is retained:

- oversized masthead;
- compact metadata and live clock;
- one-pixel grid and table rules;
- system monospace for data and Helvetica/Arial for display text;
- black-on-white rows that invert on hover or keyboard focus;
- a sticky preview area on larger screens;
- an oversized black footer.

The archive fiction is replaced with real portfolio information. No fake project density or invented metrics will be added merely to imitate the reference.

## Visual System

### Color

- Paper: `#ffffff`
- Ink: `#000000`
- Muted ink: `#5f5f5f`
- Quiet surface: `#f2f2f2`
- Selection: black background with white text

No brand gradient, colored glow, glass effect, drop shadow, or decorative blur remains. The canvas also stays monochrome so it supports the page rather than becoming a separate visual style.

### Typography

- Display: `"Helvetica Neue", Helvetica, Arial, sans-serif`
- Data and body: `ui-monospace, "SFMono-Regular", Menlo, Consolas, "Liberation Mono", "Courier New", monospace`
- Display headings are uppercase, tightly tracked, and use compressed line-height.
- Body copy remains at least 16px on small screens; compact metadata may use 11–13px where it is not the primary reading content.
- Tabular numerals are enabled for dates, counters, IDs, and time.
- No external webfont request is introduced.

### Geometry

- `border-radius: 0` throughout.
- `box-shadow: none` throughout.
- One-pixel borders form the hierarchy.
- Spacing uses a compact 4/8px rhythm, with larger section intervals derived from it.
- Visible focus uses a high-contrast outline and is never removed.

## Information Architecture

### Global masthead

The existing rounded navigation becomes a square, sticky masthead. The wordmark and current section remain text links. Desktop shows the complete navigation in one row. Mobile uses native `<details>` and `<summary>` disclosure so navigation remains operable without JavaScript and closes through standard browser behavior.

The home masthead expands into the page's primary statement:

- `BARKAH / PORTFOLIO`
- current Jakarta time and UTC offset;
- current date;
- `AI ASSISTED DEVELOPER · INDONESIA`;
- real counts for projects and notes.

The clock pauses while the page is hidden and resumes when visible.

### Home page

The home page is composed of:

1. Oversized masthead and concise profile statement.
2. A utility strip containing project filter, result count, and interaction hint.
3. Selected-work archive table.
4. Sticky procedural preview on desktop/tablet.
5. Field-notes table sourced from the blog collection.
6. Contact statement and oversized black footer.

The existing portrait is not placed in the primary index. It remains available on the About page, where personal context is expected.

### Portfolio index

All project entries are server-rendered as rows with these columns:

- ID
- Project
- Year
- Role
- Stack

Filter matches project title, role, year, ID, and tags. Sortable headers maintain `aria-sort`. Sorting supports ID, title, year, and role; stack remains display-only. Each title is a normal link to its existing project detail route.

### Project preview

On pointer hover or keyboard focus, the selected row updates a sticky preview with:

- procedural canvas;
- project title;
- ID, year, and role;
- short project description;
- link to the complete case study.

Touch devices expose an explicit `Preview` button rather than depending on hover or a first-tap/second-tap convention. The preview opens in a native `<dialog>` styled as a bottom sheet, with a visible close control and Escape support. The project title continues to navigate directly.

### Blog, About, Contact, and detail pages

- Blog becomes a `FIELD NOTES` index using the same row language without the Three.js preview.
- About becomes a dossier: portrait, short biography, skill lists, languages, and tools separated by rules.
- Contact becomes a plain data-entry sheet. Labels stay visible; the current mail action remains unchanged.
- Project and blog detail routes use a compact metadata masthead and a readable single-column content measure.
- Existing public brochure files and `src/pages/brosur.astro` are excluded from this redesign.

### Footer

The footer becomes a black block with large `AVAILABLE / FOR WORK` display text, contact links, location, stack colophon, copyright, and a visible `Back to top` link. It contains no fabricated availability claim beyond the existing profile copy.

## Interactive Architecture

Astro remains responsible for routes, content loading, layout, metadata, and all meaningful HTML. Tailwind remains the utility layer, with the global stylesheet owning design tokens and cross-page primitives.

The existing React integration is reused for the interactive project index rather than adding another UI framework. The index is server-rendered and hydrated as a single island. Without hydration, project rows and links remain visible and usable in their default order.

Two new runtime packages are required:

- `three` for the procedural WebGL canvas;
- `gsap` for short entrance and preview transitions.

No additional icon, animation, state-management, shader, or component dependency is introduced.

## Canvas Design

Three.js owns one real `<canvas>` element inside the project preview. There is no second canvas system.

The renderer uses an orthographic camera and a small set of built-in geometries and line primitives. A deterministic FNV-1a hash of the project ID selects composition values such as scale, rotation, density, and placement. The same project therefore always produces the same artifact.

Performance constraints:

- Three.js is dynamically imported only when the preview first becomes active.
- Rendering is event-driven. There is no permanent `requestAnimationFrame` loop.
- A short render loop may run only during the active 180–280ms GSAP transition, then stops.
- Device pixel ratio is capped at `1.5`; small screens use a cap of `1`.
- Renderer dimensions come from the canvas container, not the window.
- Resize work is driven by `ResizeObserver` and scheduled once per animation frame.
- WebGL resources are disposed when the island is removed.

The canvas is decorative and marked `aria-hidden="true"`. All project information is repeated as accessible text next to it.

## Motion Design

Motion remains subordinate to the brutalist layout:

- Masthead entrance: 240–320ms, opacity and a maximum 12px vertical offset.
- Row entrance: subtle 180–240ms stagger, capped at eight visible items.
- Preview change: 180–280ms transform/crossfade.
- Row inversion and control feedback: CSS color transition of 60–100ms.
- No parallax, scroll pinning, magnetic cursor, looping particles, or continuous camera movement.

GSAP is loaded only for pages that use it. When reduced motion is active, content renders in its final state, preview geometry changes without tweening, and the preference listener reacts to mid-session operating-system changes.

## Data Flow

1. Astro loads existing project and blog content collections during the build.
2. Pages map collection entries to small serializable archive records.
3. The server renders the complete tables and links.
4. The hydrated project-index island filters and sorts the provided records locally.
5. Hover, focus, or Preview activation sets the active project ID.
6. The first active selection dynamically imports the canvas renderer and GSAP.
7. The procedural renderer hashes the ID and draws the matching monochrome composition.

No API, database, analytics service, remote font, or client-side content fetch is introduced.

## Failure and Fallback Behavior

- If JavaScript is unavailable, all content and routes remain readable and navigable.
- If Three.js fails to load or WebGL is unavailable, the preview shows project metadata and a clear monochrome fallback panel; navigation is unaffected.
- If GSAP fails to load, state changes occur immediately without animation.
- An empty filter result displays `No matching work` and a reset action.
- Invalid or missing project metadata remains a build-time content error through the existing Astro content schema.
- Canvas initialization errors are caught once and do not retry in a loop.

## Accessibility

- A skip link precedes the sticky masthead.
- Navigation, filter, sorting, project links, preview buttons, dialog, and close control work from the keyboard.
- Table headers expose their current sort direction through `aria-sort`.
- Result count changes are announced through one polite live region.
- Row inversion is not the only selection indicator; focus outline and text labels remain visible.
- Mobile touch targets are at least 44 by 44 CSS pixels.
- The dialog traps focus through native behavior and returns focus to its Preview button when closed.
- Decorative canvas output is hidden from assistive technology and has adjacent text equivalence.
- Zoom remains enabled and sticky elements do not cover focused controls.

## Responsive Behavior

- `>= 1024px`: two-column index, approximately 66% table and 34% sticky preview.
- `768–1023px`: two-column index with tighter metadata and a narrower preview.
- `< 860px`: sticky preview is removed from the document flow; explicit Preview buttons open the bottom-sheet dialog.
- `< 720px`: Stack is hidden from the table row and remains available in the preview.
- `< 560px`: Role is also moved to the preview, leaving ID, project, and year in the table.
- At every width, title wrapping is preferred over clipping and the document has no horizontal scroll.

## File-Level Plan Boundary

Likely existing files to modify during implementation:

- `package.json` and `bun.lock`
- `src/styles/global.css`
- `src/layouts/SiteLayout.astro`
- `src/components/Header.astro`
- `src/components/Footer.astro`
- `src/components/SectionHeading.astro`
- `src/components/ArticleList.astro`
- `src/components/ContactLinks.astro`
- `src/components/ProjectFilter.tsx`
- `src/pages/index.astro`
- `src/pages/portfolio/index.astro`
- `src/pages/portfolio/[id].astro`
- `src/pages/blog/index.astro`
- `src/pages/blog/[id].astro`
- `src/pages/about.astro`
- `src/pages/contact.astro`

Likely focused files to add:

- a small pure archive utility module for IDs, filtering, sorting, and deterministic hashing;
- one small Three.js preview module;
- one minimal Bun test file for the pure archive behavior.

The implementation plan may reduce this list when existing files can be reused unchanged. It must not expand into unrelated refactoring.

## Verification Strategy

Automated verification:

- A Bun test first proves deterministic hashing plus filter/sort behavior.
- `bun run build` validates Astro, TypeScript, content collections, and production output.
- The complete available test suite is run after each behavior-changing task.

Browser verification on a fresh localhost-only server:

- Home, Portfolio, Blog, About, Contact, and one project detail route.
- Viewports: 375x812, 768x1024, 1024x768, and 1440x900.
- Navigation disclosure, filtering, sorting, keyboard focus, project navigation, preview selection, mobile dialog, and close behavior.
- Reduced-motion mode, JavaScript-disabled content visibility, no horizontal overflow, and console errors.
- Canvas sizing, lazy initialization, and absence of a permanent animation loop after transitions settle.

Results will be reported as `PASS`, `FAIL`, and `NOT RUN`; unavailable optional tooling will not be installed solely for verification.

## Explicit Non-Goals

- Rewriting portfolio content or inventing projects, clients, metrics, or testimonials.
- Replacing Astro, Tailwind, React, content collections, or existing routes.
- Adding a CMS, backend, database, analytics, dark mode, theme switcher, custom cursor, audio, or page-transition framework.
- Creating a full-screen 3D scene or animation that runs continuously.
- Publishing or deploying the redesign.
- Modifying the existing untracked brochure page and assets.
