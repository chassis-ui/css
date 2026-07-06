# Documentation Style Guide

*Last reviewed: 2026-06-07 against `site/content/docs/helpers/focus-ring.mdx`.*

How to write component, helper, and concept docs for chassis-css. This guide codifies conventions established across the docs (`site/content/docs/**/*.mdx`) so contributors and reviewers have one place to reference. The reference implementations are [`components/stepper.mdx`](../site/content/docs/components/stepper.mdx), [`components/navbar.mdx`](../site/content/docs/components/navbar.mdx), [`helpers/focus-ring.mdx`](../site/content/docs/helpers/focus-ring.mdx), and [`customize/optimize.mdx`](../site/content/docs/customize/optimize.mdx).

## How this guide is organized

- **Language (§1–5)** — voice, tone, and how to reference code in prose.
- **Structure (§6–10)** — frontmatter, section order, headings, and the closing CSS section.
- **Components and conventions (§11–16)** — MDX components, callouts, accessibility, the JavaScript API section, cross-references, and code formatting inside examples.
- **Code blocks and doc length (§17–20)** — language tags, when to show partial vs full code, when to split a doc.
- **Lint checklist** — what to verify before opening a PR.
- **Appendix A** — MDX component reference (signatures, defaults, when to use each).

Each rule links back to related rules so a reader chasing one question lands on all the others that matter.

---

## Language

### 1. Voice by doc type

The right prose voice depends on the doc category. There are three distinct conventions, and mixing them in the wrong context produces prose that either feels like a marketing page or sounds robotic.

| Doc type | Voice | Second-person `you/your` | First-person `we/our` |
| --- | --- | --- | --- |
| Component, helper, and utility docs | Instructive | ✗ Avoid | ✗ Avoid |
| Core Concepts (`core-concepts/*.mdx`) | Instructive | ✗ Avoid | ✗ Avoid |
| Getting Started + Customize (`getting-started/*.mdx`, `customize/*.mdx`) | Tutorial | ✓ Appropriate | ✗ Avoid |
| Overview / index pages (`*/overview.mdx`) | Tutorial | ✓ Appropriate | ✗ Avoid |

---

**Instructive voice** (component, helper, and core-concepts docs) avoids `you`, `your`, `yours`, `we`, `our`, `ours`, and `us` in prose. The reader is consulting these docs to understand API behavior or system architecture, not following a guided procedure; a narrator removes focus from the framework itself.

**Why:** removing the implicit narrator keeps prose focused on what the framework does. Instructive voice also reads as reference documentation rather than marketing copy.

**Good:**

> Apply `.horizontal` to display steps side-by-side. The layout switches to an inline grid with equal-width columns.

> The Color System uses three layers: primitive scales, semantic context palettes, and the body variables that components consume.

**Bad:**

> You can apply `.horizontal` to display steps side-by-side. We switch the layout to an inline grid with equal-width columns.

> Your color system uses three layers. We've designed them to retheme cleanly.

**Imperative vs descriptive.** Both forms are correct instructive voice; pick by what the sentence is doing.

- **Imperative** ("Apply `.horizontal`", "Wrap the list in `.stepper`") describes what the reader does. Use for setup, configuration, and required steps.
- **Descriptive** ("The layout switches to an inline grid", "The plugin closes the notification on click") describes what the framework or component does in response. Use for behavior, side effects, and framework-managed state.

A typical paragraph mixes both: imperative for the call to action, descriptive for the resulting behavior.

**Exceptions:**

- Direct quotes from external sources may retain their original voice.
- Callouts may use imperative voice ("Move focus to the drawer on open") since they are direct guidance to the implementer.
- HTML attribute values, code comments, and ARIA labels are not prose and are unaffected.

---

**Tutorial voice** (getting-started, customize, and all `overview.mdx` index pages) allows second-person "you" and "your" — they signal conditionals, context-dependent choices, and milestones in a way that reads naturally in a step-by-step guide or navigation page.

**Why core-concepts uses instructive voice:** core-concepts pages describe how the architecture works — the reader is observing the system, not following steps. "The context class re-aims CSS variables" is an architectural fact; "you re-aim CSS variables with the context class" frames the reader as actor in a way that doesn't fit a concept reference. Contrast with customize pages, where the reader is actively doing things (importing Sass, toggling flags, writing overrides) — tutorial voice fits there.

**Why overview pages use tutorial voice:** index and overview pages orient the reader — they give conditional guidance ("if you're customizing...", "you don't need to read these pages to use Chassis") that naturally addresses the reader directly. This applies regardless of section: `getting-started/overview.mdx`, `core-concepts/overview.mdx`, `customize/overview.mdx` all use tutorial voice for their navigation prose.

**Good:**

> If you already have Webpack set up, jump to [Import Chassis](#import-chassis).

> Add `@floating-ui/dom` if you use menus, popovers, or tooltips.

> You can now run `pnpm start` — the page renders with Chassis styling.

**Bad (still avoid even in tutorial docs):**

> We've now installed the loaders. Our next step is to configure the dev server.

**First-person plural is discouraged across all doc types.** "We", "us", and "our" imply a narrator who is neither the framework nor the reader, and there is always a clearer alternative: "the previous step" instead of "what we installed", "this guide" instead of "our approach". Second-person imperative steps that apply universally ("Install the plugin", "Open `webpack.config.js`") don't need any pronoun and should omit one.

The lint checklist below is scoped by doc type — see the note on the second-person check.

### 2. Every heading earns its paragraph

Every `##`, `###`, and `####` heading must be followed by at least one explanatory sentence or paragraph before any code example, bullet list, or sub-heading. The paragraph names what the section is about and why it matters.

**Floor:** one full sentence is enough. Don't pad to a paragraph if a sentence does the job; the rule is *something* before the next block, not *a lot*. Two-line paragraphs are fine when the section genuinely needs setup.

**Why:** bare-heading-then-example documentation tells readers *what* exists but not *when to reach for it*. The intro sentence is the discoverability hook.

**Good:**

```mdx
## Theming

The navbar inherits Chassis's full theming system — dark mode toggles, context color variants, and a translucent variant for over-content navbars.

### Dark mode

Apply `data-cx-theme="dark"` directly to the `.navbar` element to opt a single navbar into the dark theme regardless of the page's color scheme.

<Example code={`...`} />
```

**Bad:**

```mdx
## Theming

### Dark mode

<Example code={`...`} />
```

**Exception:** the `## CSS` section may go directly into its `<DocsCSS />` component since the API table that follows is self-documenting. This exception applies only to `<DocsCSS />` — a bare `## CSS` → `<ScssDocs>` still requires an intro sentence.

**Anti-pattern: container phrases.** Intro sentences that begin with "The following…", "Below is…", or "Here you will find…" announce content without describing it. Replace with a sentence that states what the content does or how it works.

**Bad:** "The following source and Sass variables define `.vr` and its appearance."

**Good:** "`.vr` is a simple inline-block element sized and colored by Sass variables."

One exception: a colon-terminated sentence introducing a bullet list ("These CSS properties trigger containing block formation:") is acceptable because the colon signals enumeration rather than vague pointing.

### 3. Describe behavior, not benefits

Documentation explains how the component works. It does not sell the component. Skip adjectives like "powerful", "flexible", "amazing", "best-in-class". State what the component does and let the behavior demonstrate the value.

**Good:**

> The drawer slides in from any side via the `.drawer-{position}` classes.

**Bad:**

> Our powerful drawer system lets you create amazing slide-in menus with industry-leading flexibility.

**Exception:** the frontmatter `description` field may include a light positioning phrase (it's used as the SEO meta description), e.g. *"Build responsive site and application navigation with branding, nav links, forms, and a drawer-based mobile menu."* Keep it under 160 characters and avoid superlatives.

**Use-case lists are permitted.** Naming concrete use cases — "suitable for timelines, wizards, sign-up flows" — is allowed in `description` fields and in overview paragraphs. The rule bans vague qualitative adjectives ("powerful", "flexible", "best-in-class"), not concrete examples of where the component fits.

### 4. Active voice over passive where natural

Prefer active voice. Passive is acceptable when the subject is genuinely unknown or unimportant.

**Good:**

> The Drawer plugin adds `.show` to the element when it opens.

**Bad (when avoidable):**

> The element has `.show` added to it by the Drawer plugin when it is opened.

### 5. Code references in prose

- Class names: backticks with leading dot. `` `.nav-link` ``
- Custom properties: backticks, full name. `` `--cx-stepper-gap` ``
- Sass variables: backticks with `$`. `` `$breakpoints` ``
- HTML elements: backticks with angle brackets. `` `<nav>` ``
- Attributes: backticks, with value if relevant. `` `aria-current="page"` ``
- File paths: backticks, relative to repo root. `` `scss/_navbar.scss` ``
- Mixins/functions: backticks with parens. `` `border-radius()` ``

In file:line references in review comments or commit messages, use the Markdown link form `[scss/_nav.scss:120](scss/_nav.scss:120)` so the path is clickable.

---

## Structure

### 6. Frontmatter

Every doc starts with YAML frontmatter. Required fields:

```yaml
---
title: Component Name
description: One-sentence summary, instructive voice, under 160 characters.
toc: true
---
```

Conditional fields and their accepted values:

| Field | Values | Effect |
| --- | --- | --- |
| `css_layer` | `components`, `forms` (or any other declared layer) | Renders a layer chip. Omit when the component is unlayered. |
| `css_media` | `container`, `viewport` | Declares the responsiveness model. Use `container` for `@container`-based components ([§11](#11-example-vs-resizableexample)); use `viewport` (or omit) for media-query-driven components. |
| `js` | `required`, `optional` | `required` renders a "JS required" badge (the component does not function without the bundled JS); `optional` renders a softer indicator (enhancement only). Omit for pure CSS components. |
| `deps` | List of `{title}` entries | Renders a deps list above the doc. List sibling components this one composes with. |

```yaml
deps:
  - title: Drawer
  - title: Collapse
  - title: Menu
```

**Good `description`:**

> Visualize multi-step processes with steppers built on CSS Grid — suitable for timelines, wizards, sign-up flows, and step-by-step progress indicators.

**Bad `description`:**

> The best stepper component you'll ever use! Build amazing timelines with our flexible system.

### 7. Standard section order

Component docs follow this section order. Skip sections that don't apply; the only sanctioned reorder is the Theming/Variants promotion for variant-centric components, described below.

```
## Introduction              (canonical name for the opener; describes the component)
   ### Key features          (optional bullet list)
## Basic structure           (canonical name for the minimal working example)
## Content components        (sub-components, when the component composes from parts)
## Layout options            (containers, placement, alignment)
## Advanced features         (responsive behavior, opt-in patterns, JS integration)
## Theming                   (dark mode, context variants — see "Theming position" below)
## Accessibility             (component-specific a11y patterns — when nontrivial)
## JavaScript API            (when the component has a JS plugin — methods, events, options)
## CSS                       (always last)
   ### Custom properties
   ### Sass variables
   ### Sass mixins           (when applicable)
   ### Design tokens         (when the component consumes Chassis Tokens)
```

**Canonical section names.** Both "Introduction" and "Overview" appear in the docs today, as do "Basic structure", "Basic implementation", "Basic example", and "Basic usage". Going forward, **use `## Introduction` and `## Basic structure`**. Existing docs may be migrated opportunistically; don't gate unrelated PRs on the rename.

**Theming position.** For most components — Accordion, Card, Navbar, Nav, Table, Drawer, Modal — theming is decorative and secondary to layout and usage. Place `## Theming` after Layout / Advanced features so readers reach the customization story after they understand the component itself.

For **variant-centric components** where the variants ARE the primary usage surface — Button, Badge, Chip, Notification, Alert, Avatar — promote `## Theming` (or its specific sub-section like `## Variants` or `## Context variants`) to immediately after `## Basic structure`. The variants demonstrate how the component is meant to be used, so they belong up front. **This is the only sanctioned reorder.**

**Edge case.** When context variants convey functional state rather than decoration (e.g. Stepper's per-item context indicates past/current/next status), the section can stay mid-document close to the usage examples it relates to. Use judgment — if a reader who skipped the section would miss something about how the component conveys meaning, keep it close to the basic usage.

**Accessibility and JavaScript API sit just before `## CSS`.** Both are reference material readers consult after they've internalized the component. Putting them at the bottom keeps the narrative sections (basic → layout → advanced → theming) flowing without reference-heavy interruptions. See [§13](#13-accessibility-patterns) for when a component warrants its own `## Accessibility` section.

Concept docs (`customize/*.mdx`, `getting-started/*.mdx`) use looser structure and tutorial voice (see [§1](#1-voice-by-doc-type)) but still lead with an introductory paragraph and end with code references where applicable.

**Helper docs** (`helpers/*.mdx`) are a distinct third category between components and concept docs. They do not use the Introduction → Basic structure canonical order and most have no Theming, Accessibility, or JavaScript API sections. The typical shape is:

```
[Intro paragraph — what the class does, when to reach for it]
[Feature sections named for the capability, not the component lifecycle]
## Customization          (optional — for helpers with rich CSS variable usage examples)
   ### CSS variables
   ### Sass variables
   ### Utilities
## CSS                    (always last)
   ### Custom properties  (when the helper reads from :root custom properties)
   ### Sass variables     (when the helper has dedicated Sass variables)
   ### Sass mixins        (when a mixin backs the helper class)
```

Helper CSS sections omit the component boilerplate components (`<DocsCSS>`, `<DocsCSSVars>`, `<DocsSASSVars>`). Write a short descriptive sentence after `## CSS` and use `<ScssDocs>` directly. See [§10](#10-the--css-section-template) for the helper CSS template.

### 8. Heading hierarchy

Don't skip levels. `##` → `###` → `####`, never `##` → `####`. Use `####` sparingly — three levels of nesting usually signals a section that wants to be promoted to its own `###` or split into a sibling page.

### 9. Heading length, case, and punctuation

**Length.** Keep `##` and `###` headings under **~25 characters**. The ToC sidebar column is ~200px wide and longer titles wrap to a second line, which makes the ToC hard to scan. `####` headings have the same constraint when they appear in the ToC (depends on site config).

**Good:** `Toggle button placement` (23 chars), `Responsive behavior` (19 chars), `Custom properties` (17 chars)

**Bad:** `Configuring the toggle button for collapsed states` (50 chars) — too long; split into a parent heading + sub-heading, or shorten to `Toggle button` with the longer phrasing in the intro paragraph.

**Sentence case.** Capitalize only the first word and any proper nouns. `### Basic structure`, not `### Basic Structure`. `### Context variants`, not `### Context Variants`. A handful of existing docs slip into title case — fix opportunistically.

**No trailing punctuation.** Headings don't end in `.`, `:`, `?`, or `!`. Em-dashes inside a heading are discouraged; if a heading needs a clarifier, push it to the intro paragraph instead.

**Component title pluralization.** Use the plural form when the doc primarily catalogs variants of a small unit (`Buttons`, `Badges`, `Chips`, `Cards`, `Toasts`, `Notifications`, `Tooltips`, `Skeletons`, `Spinners`). Use the singular for structural components that appear once per page or once per region (`Accordion`, `Alert`, `Drawer`, `Modal`, `Navbar`, `Stepper`, `Tab`). When in doubt, match the closest existing doc; don't invent a third form.

### 10. The `## CSS` section template

The closing CSS section uses a fixed template so the API reference is consistent across components:

```mdx
## CSS

<DocsCSS component="<Component>" />

### Custom properties

<DocsCSSVars component="<Component>" />

<ScssDocs name="<component>-css-vars" file="scss/_<component>.scss" />

### Sass variables

<DocsSASSVars component="<Component>" />

<ScssDocs name="<component>-variables" file="scss/config/_defaults.scss" />

### Sass mixins

One-sentence description of what each mixin emits and when to use it.

<ScssDocs name="<mixin-name>" file="scss/_<component>.scss" />

### Design tokens

<DocsDesignTokens component="<Component>" />

<ScssDocs name="<component>-tokens" file="scss/tokens/_<component>.scss" />
```

**Multiple SCSS slices.** Components with multiple `scss-docs-*` markers (e.g. `navbar-css-vars` + `navbar-nav-css-vars`) emit `<ScssDocs>` blocks in source order, optionally separated by short paragraphs naming the slice.

**`compile` attribute.** `<ScssDocs>` defaults to showing the raw SCSS between the source markers. Set `compile` to render the compiled CSS output via the Sass JS API — useful when the marker block contains `@include` calls and the reader needs to see the expanded properties. Use it for `*-css-vars` markers that pull in mixin output (e.g. `notification-css-vars` expands `map-font` mixins):

```mdx
<ScssDocs name="notification-css-vars" file="scss/_notification.scss" compile />
```

**`### Design tokens` is optional.** Include it only when the component consumes Chassis Tokens with a dedicated `scss/tokens/_<component>.scss` file. Components that derive all their styling from generic foundation tokens can omit the section.

**Helper CSS section.** Helper docs use a lighter `## CSS` template without the boilerplate components. Include only the sub-sections that exist for the helper:

```mdx
## CSS

One sentence describing what the helper class does (not a container phrase — see [§2](#2-every-heading-earns-its-paragraph)).

<ScssDocs name="<helper>" file="scss/helpers/_<helper>.scss" />

### Custom properties

One sentence describing the custom properties and where they are set.

<ScssDocs name="root-<helper>-variables" file="scss/_root.scss" />

### Sass variables

One sentence describing the Sass variables.

<ScssDocs name="<helper>-variables" file="scss/config/_defaults.scss" />

### Sass mixins

One sentence describing what the mixin emits and when to use it in a custom selector.

```scss
// Usage in a custom selector
.custom-selector {
  @include <mixin-name>();
}
```

<ScssDocs name="<helper>-mixin" file="scss/mixins/_<helper>.scss" />
```

**Adding SCSS markers.** `<ScssDocs>` requires `// scss-docs-start <name>` / `// scss-docs-end <name>` comment pairs wrapping the target block in the source file. Add these markers as part of the same PR when documenting a helper that lacks them. Markers in `scss/helpers/_<helper>.scss` wrap the class block; markers in `scss/config/_defaults.scss` wrap the helper's dedicated variable group; markers in `scss/mixins/_<helper>.scss` wrap the mixin body.

---

## Components and conventions

### 11. `<Example>` vs `<ResizableExample>`

- **`<Example>`** — the default. Renders at a fixed width inside the doc page. Use it for everything except components whose responsiveness is driven by container queries.
- **`<ResizableExample>`** — wraps the output in a width-resizable container. Only useful for components whose `.{breakpoint}:*` classes are implemented with container queries (`@container`), not viewport media queries. The resize control changes the example's inline-size, which fires container-query rules but never fires `@media (min-width: ...)` rules — the viewport never changes.

Concrete guidance:

- **Use `<ResizableExample>`** for `.navbar` (drawer-to-inline transition uses `@container`), `.stepper` (vertical-to-horizontal switch uses `@container`), `.nav-overflow`, and other navigation-style components built on container queries.
- **Use `<Example>`** for everything else, including components with responsive utility classes that resolve to media queries — those won't respond to the resize control and `<ResizableExample>` just adds a non-functional handle.

Mention the resize affordance in the intro paragraph for the first `<ResizableExample>` in a doc:

> Resize the example below to preview the transition between drawer and inline modes.

### 12. Callouts

Use the `<Callout>` component for asides that interrupt the reading flow but are important enough to highlight. Types and intent:

- **`<Callout type="info">`** — context the reader benefits from but doesn't strictly need to use the component. Tips, alternatives, related patterns.
- **`<Callout type="warning">`** — gotchas that will cause real problems if ignored. Accessibility failures, browser quirks, breaking edge cases.
- **`<Callout name="info-prefersreducedmotion">`** — named callouts reuse standardized content (defined in the site config). Use for boilerplate notices like `prefers-reduced-motion` advisories.

**Good warning:**

> When the controlled container precedes the toggler in document order, keyboard and assistive-technology users may have trouble locating the newly revealed content. Move focus to the drawer programmatically on open, and keep `aria-controls` pointing at the controlled element.

**Bad warning (this should be prose, not a callout):**

> Be aware that the drawer can be customized.

### 13. Accessibility patterns

Every component example must carry the ARIA attributes appropriate to its semantic role. The reference patterns:

- **Current page in nav:** `aria-current="page"` on the active `.nav-link`
- **Current item in a set:** `aria-current="true"`
- **Current step in a process:** `aria-current="step"`
- **Toggle buttons:** `aria-label="Toggle <thing>"`, `aria-controls="<id>"`, `aria-expanded="false"` (Drawer/Collapse plugins keep `aria-expanded` in sync)
- **Drawer / Dialog:** `aria-labelledby` pointing at the title element id
- **Visually-hidden helper text:** `<span class="visually-hidden">…</span>` for screen-reader-only context (e.g. "Current step: ")

**When a component warrants its own `## Accessibility` section.** Add one when any of the following apply:

- The component carries implicit live-region semantics (`role="status"`, `role="alert"`, `aria-live`).
- Focus management matters — focus traps, focus restoration after dismissal, programmatic focus moves.
- The component has nontrivial keyboard interaction (arrow-key navigation, Escape-to-close, Enter/Space activation patterns beyond a button click).
- ARIA state synchronization is required (`aria-expanded`, `aria-current`, `aria-selected`) and the markup pattern is not obvious from the example.

When none of those apply — for purely visual components like Avatar, Spinner, or static Card — the relevant `aria-*` attributes on the example itself are enough; skip the dedicated section.

Position the `## Accessibility` section just before `## JavaScript API` / `## CSS` per [§7](#7-standard-section-order). Reference implementation: [`components/navbar.mdx`](../site/content/docs/components/navbar.mdx).

### 14. JavaScript API section

Components that ship a JS plugin get a `## JavaScript API` section between `## Accessibility` and `## CSS`. Open with a one-sentence summary, show the ES module import, then break the section into `### Triggers` (data-attribute API), `### Initialization` (programmatic instantiation), `### Methods`, and `### Events` as applicable. Reference implementation: [`components/notification.mdx`](../site/content/docs/components/notification.mdx#javascript-api).

**Import the class as an ES module.** Chassis JS is distributed as an ES module; the namespace pattern (`chassis.Button(...)`) is legacy and should not appear in new docs.

```mdx
## JavaScript API

The Notification plugin handles dismissal and exposes events for integrating with surrounding flows. Chassis JS ships as an ES module — import the `Notification` class:

```js
import { Notification } from '@chassis-ui/css'
```

### Triggers

The data-attribute API wires up dismissal without writing any JavaScript on the page beyond the bundled plugin:

<JsDismiss name="notification" />

### Initialization

For programmatic access — calling methods or listening to events — instantiate each element with the `Notification` class:

```js
const notifications = [...document.querySelectorAll('.notification')]
  .map(element => new Notification(element))
```

### Methods

The plugin exposes four instance methods for programmatic control:

<CxTable>
| Method | Description |
| --- | --- |
| `close` | Closes the notification by removing it from the DOM. |
| `dispose` | Destroys the instance and clears stored data from the DOM element. |
| `getInstance` | Static — returns the instance bound to a DOM element, or `null`. |
| `getOrCreateInstance` | Static — returns the existing instance, or creates one. |
</CxTable>
```

**`### Methods` and `### Events` still need their intro sentence per [§2](#2-every-heading-earns-its-paragraph).** Don't let the `<CxTable>` immediately follow the heading; lead with a one-sentence summary of what the table contains.

**Section order rationale.** Triggers comes before Initialization because the data-attribute API is the simpler path; readers who only need dismissal stop reading there. Initialization, Methods, and Events serve the JS-first audience.

If the plugin accepts options, add a `### Options` sub-section between Methods and Events, each with its own `<CxTable>` and intro sentence.

### 15. Cross-references

**Within Chassis docs.** Use the `[[docsref:/path/to/doc]]` token inside Markdown link syntax. The build resolves the token against the configured docs path at compile time, so the link stays correct across deployments and locales. The path is relative to the docs root (no leading site URL, no trailing slash).

```mdx
[position utilities]([[docsref:/utilities/position]])
[the Alert component]([[docsref:/components/alert]])
```

To link a specific sub-section of another doc, append the heading slug:

```mdx
[the Modal JavaScript API]([[docsref:/components/modal#javascript-usage]])
```

**Within the same doc.** Use plain `#anchor` links. Anchor IDs are auto-generated from heading text by slugifying — lowercase, spaces to hyphens, punctuation stripped. `### ARIA roles` becomes `#aria-roles`; `### Notifications with actions` becomes `#notifications-with-actions`.

Two rules:

- Don't create two headings with the same slug in the same doc. If a doc legitimately needs duplicate heading text in different sections, rephrase one or assign an explicit `id` via raw HTML.
- Verify anchors after renaming a heading — internal links to the old slug silently break.

**External references.** Standard Markdown links. Prefer authoritative sources (W3C, MDN, WAI-ARIA APG) over blog posts.

**Component source.** Link `[scss/_component.scss](scss/_component.scss)` with optional line number `[scss/_component.scss:120](scss/_component.scss:120)`.

### 16. Code formatting in examples

- **Indentation:** 2 spaces inside example code blocks (matches the surrounding MDX).
- **Class ordering:** keep classes in HTML examples in the order base → layout modifier → state. E.g. `class="nav-link active"` not `class="active nav-link"`. When a layout modifier is absent, base → state.
- **Self-closing void elements:** `<input />`, `<br />`, `<img />` — match the existing file's pattern (most Chassis docs use unclosed `<input>`, but XHTML-style is also accepted).
- **Comments:** use HTML comments inside examples to mark sections of long markup. `<!-- Drawer body -->`.
- **Quoting:** double quotes for HTML attributes (`href="#"` not `href='#'`).

For the broader code-block conventions (language tags, when to show partial vs full code, fenced blocks outside `<Example>`), see [§17–20](#code-blocks-and-doc-length).

---

## Code blocks and doc length

### 17. Fenced code language tags

Always tag fenced code blocks with the source language so syntax highlighting and copy-to-clipboard tooling work correctly. The conventions in use across the docs:

| Block kind | Language tag | Notes |
| --- | --- | --- |
| HTML markup outside `<Example>` | `` ```html `` | E.g. accessibility callout examples, raw `<svg>` snippets. |
| JavaScript usage | `` ```js `` | Includes ESM imports, instantiation, and event listeners. |
| SCSS | `` ```scss `` | Use for hand-written examples; prefer `<ScssDocs>` for snippets pulled from source. |
| Compiled CSS | `` ```css `` | For showing compiled output by hand; otherwise pass `compile` to `<ScssDocs>` ([§10](#10-the--css-section-template)). |
| Shell commands | `` ```bash `` | Installation, build, and CLI commands. |
| MDX/Markdown | `` ```mdx `` / `` ```md `` | When the styleguide or a meta-doc shows authoring patterns. |

Untagged fenced blocks display without highlighting and break the toolbar — never ship one.

### 18. Partial vs full code

`<Example>` blocks should always be standalone and runnable — a reader copying the code into an empty HTML document should see a working component.

Inline `` ```js `` / `` ```html `` snippets in narrative sections (Accessibility, JS API) can be partial. Show only the pattern under discussion; assume the reader has the surrounding setup from earlier in the doc. Don't repeat boilerplate.

For event listener / focus-management examples, prefer working code over comment-only placeholders. `document.getElementById('triggerButton').focus()` is more useful than `// move focus here`.

### 19. Inline code vs code blocks

- **Inline backticks** for single identifiers, attribute names, file paths, and short literal values. `` `.notification` ``, `` `aria-current="page"` ``, `` `scss/_button.scss` ``.
- **Fenced blocks** for anything that spans multiple lines, or for single lines that the reader will copy and run.

If a one-liner is *demonstrating syntax* rather than something to copy, prefer an inline-code form. If it's *something to run*, prefer a fenced block.

### 20. Document length and splitting

A doc is too long when:

- A `##` section has more than three `###` sub-sections covering distinct topics, or
- The doc exceeds ~600 lines of MDX, or
- The ToC requires the reader to scroll to see all top-level sections.

When any threshold is hit, prefer splitting along the natural axis:

- **By component family.** If "Forms" covers inputs, selects, checkboxes, and validation, give each its own doc and link from a Forms landing page.
- **By concern.** Theming, deep customization, or migration guidance can move to sibling concept docs (`customize/*.mdx`) and be linked from the component doc's Theming section.

Don't split for size alone if the result fragments a coherent reading flow. A 700-line doc that reads end-to-end is better than three 200-line stubs that force the reader to chase context across pages.

---

## Lint checklist

Before opening a PR with a doc change, verify:

- [ ] **Voice check ([§1](#1-voice-by-doc-type)):**
  - *Component, helper, utility, and core-concepts docs:* No second-person or first-person plural in prose. Quick check: `grep -niE "\b(you|your|yours|we|our|ours|us)\b" <file>` returns nothing relevant.
  - *Getting-started, customize, and all `overview.mdx` index pages:* "you/your" are acceptable; confirm "we/us/our" are absent.
- [ ] Every `##`/`###`/`####` heading has an explanatory sentence before the next block ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] No marketing adjectives in prose ([§3](#3-describe-behavior-not-benefits)) — use-case lists are allowed.
- [ ] Frontmatter `description` is under 160 characters and instructive ([§6](#6-frontmatter)).
- [ ] Conditional frontmatter fields use accepted values ([§6](#6-frontmatter) table).
- [ ] For **component** docs, section order matches: Introduction → Basic structure → Content components → Layout → Advanced → Theming → Accessibility → JavaScript API → CSS ([§7](#7-standard-section-order)). For **helper** docs, section order is flexible — see the helper structure note in [§7](#7-standard-section-order).
- [ ] Theming placement reflects the component type ([§7](#7-standard-section-order)) — after Layout for variant-light components; right after Basic structure for variant-centric components like Button, Badge, Notification. Helper docs do not have a Theming section.
- [ ] Heading levels don't skip (`##` → `####`) ([§8](#8-heading-hierarchy)).
- [ ] All `##` / `###` headings under ~25 characters, sentence case, no trailing punctuation ([§9](#9-heading-length-case-and-punctuation)).
- [ ] Component title pluralization matches the convention ([§9](#9-heading-length-case-and-punctuation)).
- [ ] `## CSS` section follows the appropriate template ([§10](#10-the--css-section-template)): for **components**, `DocsCSS` → `DocsCSSVars` → `ScssDocs` → `DocsSASSVars` → `ScssDocs` → (optional Sass mixins, Design tokens); for **helpers**, a descriptive sentence followed by `<ScssDocs>` and only the applicable sub-sections.
- [ ] No container phrases ("The following…", "Below is…") as intro sentences — describe what the content does instead ([§2](#2-every-heading-earns-its-paragraph)).
- [ ] `<ResizableExample>` is used only for container-query components ([§11](#11-example-vs-resizableexample)); everything else uses `<Example>`.
- [ ] Examples carry the relevant `aria-*` attributes for the component's role ([§13](#13-accessibility-patterns)).
- [ ] If the component ships a JS plugin, `## JavaScript API` is present and uses the ES module import pattern ([§14](#14-javascript-api-section)).
- [ ] Cross-references use `[[docsref:/...]]` for internal links and Markdown for external ([§15](#15-cross-references)).
- [ ] Class names, vars, file paths use the backtick conventions ([§5](#5-code-references-in-prose)).
- [ ] All fenced code blocks have a language tag ([§17](#17-fenced-code-language-tags)).

---

## What's not in this guide (yet)

These conventions exist in practice but haven't been formalized here. To propose a new convention:

1. Find at least three docs that already follow (or would benefit from) the pattern.
2. Open a PR that adds the section to this guide, citing those docs as evidence.
3. If the pattern is contested, link the PR in `.github/` for discussion before merging.

Currently unwritten:

- Convention for documenting JS plugin options (some components have them, none document them consistently).
- Convention for documenting RTL-specific behavior — when to call it out, where to put the note.
- When to introduce a one-off MDX component (`MenuPlacementPlayground`, `NavbarPlacementPlayground`) vs writing prose plus standard `<Example>` blocks.
- Translation / i18n notes for `aria-label` and similar attributes in examples.
- Screenshot and Figma-image conventions — when to embed images, alt text rules, where to store source files.

---

## Appendix A — MDX component reference

The Chassis docs site exposes a small set of MDX components for rendering examples, callouts, tables, and source-derived snippets. Source: [`site/src/components/shortcodes/`](../site/src/components/shortcodes/) and [`@chassis-ui/docs`](https://www.npmjs.com/package/@chassis-ui/docs). Listed here in order of frequency.

### `<Example>`

Renders a live preview of the component and the source markup below it. Default for all component examples.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `code` | `string \| string[]` | required | The example markup. Array entries are joined with `\n`. |
| `class` | `string` | — | Classes applied to the preview wrapper (e.g. `vstack gap-medium` to stack multiple variants). |
| `lang` | `string` | `html` | Language for the source code block. |
| `file` | `string` | — | When set, displays the file path in the source toolbar instead of the language label. |
| `id` | `string` | — | DOM id on the preview wrapper. |
| `lineNumbers` | `boolean` | `false` | Show line numbers in the source block. |
| `showPreview` | `boolean` | `true` | Hide the rendered preview, source-only mode. |
| `showMarkup` | `boolean` | `true` | Hide the source block, preview-only mode. |
| `customMarkup` | `string \| string[]` | — | Source markup that differs from the rendered `code` (e.g. when the preview includes inline styles for demo purposes). |
| `addStackblitzJs` | `boolean` | `false` | Bundle the doc's referenced JS snippets when opening the example in StackBlitz. Use for interactive examples that depend on `<JsDocs>` blocks. |

### `<ResizableExample>`

Wraps the preview in a width-resizable container. Use only for components whose responsiveness is driven by `@container` queries — see [§11](#11-example-vs-resizableexample).

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `code` | `string \| string[]` | required | The example markup. |
| `class` / `className` | `string` | — | Classes applied to the resizable container. |
| `initialWidth` | `string` | `100%` | Starting width of the resizable container. |
| `minWidth` | `string` | `200px` | Minimum width the user can resize down to. |
| `showMarkup` | `boolean` | `true` | Hide the source block. |

### `<Callout>`

Highlighted aside. See [§12](#12-callouts) for when to use each type.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `type` | `'info' \| 'warning' \| 'danger'` | `'info'` | Visual treatment. |
| `name` | `string` | — | Render a shared callout from `site/content/callouts/<name>.md`. Overrides the slot content. |
| *(slot)* | MDX content | — | Inline callout body. Ignored when `name` is set. |

Optional `title` attribute (on the inline form) renders a bold leading title above the body.

### `<CxTable>`

Wraps a Markdown table in a responsive scroll container. Use for any table that might overflow on narrow viewports — methods tables, events tables, frontmatter schemas.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `class` | `string` | `table` | CSS class applied to the inner `<table>` by the rehype plugin. |

### `<ScssDocs>`

Renders an SCSS snippet pulled from source between `// scss-docs-start <name>` and `// scss-docs-end <name>` markers.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `string` | required | Marker name to extract from the source file. |
| `file` | `string` | required | Source path relative to the repo root. |
| `compile` | `boolean` | `false` | When `true`, compiles the snippet via the Sass JS API and renders the resulting CSS — useful for blocks that contain `@include` calls. See [§10](#10-the--css-section-template). |

### `<JsDocs>`

Renders a JavaScript snippet pulled from source between `// js-docs-start <name>` and `// js-docs-end <name>` markers. Same prop shape as `<ScssDocs>` minus `compile`.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `string` | required | Marker name. |
| `file` | `string` | required | Source path relative to the repo root. |

### `<JsDismiss>`

Renders the standard data-attribute dismissal documentation for a component. Use inside `## JavaScript API` → `### Triggers`.

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `name` | `string` | required | Component name (used in the rendered prose and code, e.g. `"notification"`, `"drawer"`). |

### `<DocsCSS>`, `<DocsCSSVars>`, `<DocsSASSVars>`, `<DocsDesignTokens>`

Boilerplate paragraph generators for the `## CSS` section. All four take the same shape:

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `component` | `string` | — | Component name in the rendered sentence (`"Notification"` → "The Notification component…"). Omit for the generic "This component" fallback. |
| `plural` | `boolean` | `false` | Use plural phrasing ("These components" / "Form components"). |
| `exposed` | `boolean` | `false` | `<DocsCSS>` / `<DocsSASSVars>`: marks variables as runtime-overridable via `--cx-` custom properties. `<DocsCSSVars>`: not accepted. |
| `cascading` | `boolean` | `false` | `<DocsCSSVars>` only: appends the cascading-variables explanation and links to the context-class doc. |

Each component renders a single paragraph. Place it directly under the corresponding `###` heading; no manual intro sentence is needed.
