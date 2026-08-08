# Documentation Style Guide

How to write component, helper, and concept docs for chassis-css. This guide codifies conventions established across the docs (`site/content/docs/**/*.mdx`) so contributors and reviewers have one place to reference.

## How this guide is organized

- **Language (§1–5)** — voice, tone, code references in prose.
- **Structure (§6–10)** — frontmatter, section order, headings, the closing CSS section.
- **Components and conventions (§11–16)** — MDX components, callouts, accessibility, the JS API section, cross-references, code formatting.
- **Code blocks and doc length (§17–20)** — language tags, partial vs full code, when to split a doc.
- **Lint checklist** — what to verify before opening a PR.
- **Appendix A** — MDX component reference (signatures, defaults, when to use each).

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

**Instructive voice** (component, helper, and core-concepts docs) avoids `you`, `your`, `yours`, `we`, `our`, `ours`, and `us` in prose — the reader is consulting these docs to understand API behavior or system architecture, not following a guided procedure. Removing the narrator keeps prose focused on the framework and reads as reference documentation rather than marketing copy.

**Good:** "Apply `.my-modifier` to display items side-by-side. The layout switches to an inline grid with equal-width columns."

**Bad:** "You can apply `.my-modifier` to display items side-by-side. We switch the layout to an inline grid with equal-width columns."

**Imperative vs descriptive.** Both are correct instructive voice: imperative ("Apply `.my-modifier`") for what the reader does — setup, configuration, required steps; descriptive ("The layout switches to an inline grid") for what the framework does in response. A typical paragraph mixes both.

**Exceptions:** direct quotes keep their original voice; callouts may use imperative voice ("Move focus to the panel on open") as direct guidance; HTML attribute values, code comments, and ARIA labels aren't prose and are unaffected.

---

**Tutorial voice** (getting-started, customize, and all `overview.mdx` index pages) allows second-person "you"/"your" — they read naturally in a step-by-step guide or navigation page. Core-concepts pages stay instructive because the reader is observing the architecture, not following steps, unlike customize pages where the reader is actively doing things (importing Sass, toggling flags). Overview/index pages get tutorial voice regardless of section — `getting-started/overview.mdx`, `core-concepts/overview.mdx`, and `customize/overview.mdx` all use it for their navigation prose.

**Good:** "If you already have a bundler set up, jump to [Import Chassis](#import-chassis)." / "You can now run `pnpm start` — the page renders with Chassis styling."

**Bad (still avoid even in tutorial docs):** "We've now installed the loaders. Our next step is to configure the dev server."

**First-person plural is discouraged across all doc types.** "We"/"us"/"our" imply a narrator who is neither the framework nor the reader — there's always a clearer alternative ("the previous step" instead of "what we installed"). Universal imperative steps ("Install the plugin") don't need a pronoun at all.

### 2. Every heading earns its paragraph

Every `##`, `###`, and `####` heading must be followed by at least one explanatory sentence before any code example, bullet list, or sub-heading, naming what the section is about and why it matters — bare-heading-then-example tells readers *what* exists but not *when to reach for it*.

**Floor:** one full sentence is enough — don't pad.

**Good:**

```mdx
## Theming

MyComponent inherits Chassis's full theming system — dark mode toggles, context color variants, and a translucent variant for over-content use.

### Dark mode

Apply `data-cx-theme="dark"` directly to the `.my-component` element to opt a single instance into dark theme regardless of the page's color scheme.

<Example code={`...`} />
```

**Bad:**

```mdx
## Theming

### Dark mode

<Example code={`...`} />
```

**Exception:** the `## CSS` section may go directly into its `<DocsCSS />` component since the API table that follows is self-documenting. This exception applies only to `<DocsCSS />` — a bare `## CSS` → `<ScssDocs>` still requires an intro sentence.

**Anti-pattern: container phrases.** Intro sentences starting with "The following…" or "Below is…" announce content without describing it — state what the content does instead. **Bad:** "The following source and Sass variables define `.my-helper`." **Good:** "`.my-helper` is a simple inline-block element sized and colored by Sass variables." Exception: a colon-terminated sentence introducing a bullet list is fine, since the colon signals enumeration rather than vague pointing.

### 3. Describe behavior, not benefits

Documentation explains how the component works; it does not sell the component. Skip adjectives like "powerful", "flexible", "amazing", "best-in-class" — state what the component does and let the behavior demonstrate the value.

**Good:** "The panel slides in from any side via the `.my-component-{position}` classes."

**Bad:** "Our powerful panel system lets you create amazing slide-in menus with industry-leading flexibility."

**Exception:** the frontmatter `description` field may include a light positioning phrase (it's the SEO meta description) under 160 characters and free of superlatives. **Use-case lists are permitted** — "suitable for timelines, wizards, sign-up flows" names concrete use cases rather than banned qualitative adjectives, and is allowed in `description` fields and overview paragraphs.

### 4. Active voice over passive where natural

Prefer active voice. Passive is acceptable when the subject is genuinely unknown or unimportant.

**Good:** "The plugin adds `.show` to the element when it opens."

**Bad (when avoidable):** "The element has `.show` added to it by the plugin when it is opened."

### 5. Code references in prose

Backtick every code reference: class names with a leading dot (`` `.my-class` ``), custom properties in full (`` `--cx-my-property` ``), Sass variables with `$` (`` `$breakpoints` ``), HTML elements in angle brackets (`` `<nav>` ``), attributes with their value when relevant (`` `aria-current="page"` ``), file paths relative to the repo root (`` `scss/_component.scss` ``), and mixins/functions with parens (`` `border-radius()` ``). In review comments or commits, link file:line references so the path is clickable: `[scss/_component.scss:120](scss/_component.scss:120)`.

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
| `deps` | List of `{title}` entries, e.g. `- title: ComponentA` | Renders a deps list above the doc. List sibling components this one composes with. |

`description` follows the same instructive-voice and use-case-list rules as body prose — see [§3](#3-describe-behavior-not-benefits).

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

**Canonical section names.** Older docs use variants like "Overview" or "Basic usage" — going forward, **use `## Introduction` and `## Basic structure`**. Migrate existing docs opportunistically; don't gate unrelated PRs on the rename.

**Theming position.** For most components, theming is decorative and secondary to layout, so `## Theming` goes after Layout / Advanced features. For **variant-centric components** — where the variants ARE the primary usage surface — promote `## Theming` (or `## Variants`/`## Context variants`) to immediately after `## Basic structure`, since the variants demonstrate how the component is meant to be used. **This is the only sanctioned reorder.** Edge case: when variants convey functional state rather than decoration, use judgment and keep the section close to the usage example it relates to.

**Accessibility and JavaScript API sit just before `## CSS`** — both are reference material readers consult after internalizing the component, so keeping them at the bottom lets the narrative sections (basic → layout → advanced → theming) flow without interruption. See [§13](#13-accessibility-patterns) for when a component warrants its own `## Accessibility` section.

Concept docs (`customize/*.mdx`, `getting-started/*.mdx`) use looser structure and tutorial voice (see [§1](#1-voice-by-doc-type)) but still lead with an intro paragraph.

**Helper docs** (`helpers/*.mdx`) are a distinct third category: no Introduction → Basic structure order, and most have no Theming, Accessibility, or JavaScript API sections. The typical shape:

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

**Length.** Keep `##` and `###` headings under **~25 characters** — the ToC sidebar is ~200px wide and longer titles wrap, which makes it hard to scan. **Good:** `Toggle button placement`, `Responsive behavior`, `Custom properties`. **Bad:** `Configuring the toggle button for collapsed states` — split into a parent + sub-heading, or shorten and push the longer phrasing into the intro paragraph.

**Sentence case, no trailing punctuation.** Capitalize only the first word and proper nouns (`### Basic structure`, not `### Basic Structure`); no `.`, `:`, `?`, or `!` at the end. Fix title-case slips opportunistically.

**Component title pluralization.** Use the plural form when the doc primarily catalogs variants of a small unit (e.g. a family of small, repeatable pieces like buttons or badges). Use the singular for structural components that appear once per page or once per region (e.g. a modal, a navbar). When in doubt, match the closest existing doc; don't invent a third form.

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

**Multiple SCSS slices.** Components with multiple `scss-docs-*` markers emit `<ScssDocs>` blocks in source order, optionally separated by short paragraphs naming the slice.

**`compile` attribute.** `<ScssDocs>` shows raw SCSS by default; set `compile` to render the compiled CSS via the Sass JS API instead — useful when the marker block contains `@include` calls the reader needs expanded:

```mdx
<ScssDocs name="component-css-vars" file="scss/_component.scss" compile />
```

**`### Design tokens` is optional** — include it only when the component consumes Chassis Tokens with a dedicated `scss/tokens/_<component>.scss` file.

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

**Adding SCSS markers.** `<ScssDocs>` requires `// scss-docs-start <name>` / `// scss-docs-end <name>` comment pairs wrapping the target block; add them in the same PR when documenting a helper that lacks them. Markers in `scss/helpers/_<helper>.scss` wrap the class block, in `scss/config/_defaults.scss` wrap the variable group, in `scss/mixins/_<helper>.scss` wrap the mixin body.

---

## Components and conventions

### 11. `<Example>` vs `<ResizableExample>`

- **`<Example>`** — the default, fixed-width. Use it for everything except components whose responsiveness is driven by container queries.
- **`<ResizableExample>`** — wraps the output in a width-resizable container. Only useful for components whose `.{breakpoint}:*` classes use container queries (`@container`), not viewport media queries — the resize control changes inline-size, which fires container-query rules but never `@media (min-width: ...)`. Using it for viewport-driven responsive classes just adds a non-functional handle.

Mention the resize affordance in the intro paragraph the first time `<ResizableExample>` appears in a doc: "Resize the example below to preview the transition between collapsed and inline modes."

### 12. Callouts

Use `<Callout>` for asides that interrupt the reading flow but are important enough to highlight. Types and intent:

- **`<Callout type="info">`** — helpful but non-essential context: tips, alternatives, related patterns.
- **`<Callout type="warning">`** — real gotchas: accessibility failures, browser quirks, breaking edge cases.
- **`<Callout name="info-prefersreducedmotion">`** — named callouts reuse standardized content from the site config, e.g. `prefers-reduced-motion` advisories.

**Good warning:** "When the controlled container precedes the toggler in document order, keyboard and assistive-technology users may have trouble locating the newly revealed content. Move focus to the revealed panel programmatically on open, and keep `aria-controls` pointing at the controlled element."

**Bad warning (this should be prose, not a callout):** "Be aware that this component can be customized."

### 13. Accessibility patterns

Every component example must carry the ARIA attributes appropriate to its semantic role:

- **Current page in nav / item in a set / step in a process:** `aria-current="page"` / `"true"` / `"step"` respectively.
- **Toggle buttons:** `aria-label="Toggle <thing>"`, `aria-controls="<id>"`, `aria-expanded="false"` (expand/collapse plugins keep `aria-expanded` in sync).
- **Dialog-like components:** `aria-labelledby` pointing at the title element id.
- **Visually-hidden helper text:** `<span class="visually-hidden">…</span>` for screen-reader-only context.

**When a component warrants its own `## Accessibility` section:** implicit live-region semantics (`role="status"`, `aria-live`), nontrivial focus management (traps, restoration, programmatic moves), nontrivial keyboard interaction beyond a button click, or ARIA state sync (`aria-expanded`, `aria-selected`) that isn't obvious from the example. When none apply — purely visual, static components — the `aria-*` attributes on the example itself are enough; skip the dedicated section. Position it just before `## JavaScript API` / `## CSS` per [§7](#7-standard-section-order).

### 14. JavaScript API section

Components that ship a JS plugin get a `## JavaScript API` section between `## Accessibility` and `## CSS`: a one-sentence summary, the ES module import, then `### Triggers` (data-attribute API), `### Initialization` (programmatic instantiation), `### Methods`, and `### Events` as applicable. Import the class as an ES module — the namespace pattern (`chassis.MyComponent(...)`) is legacy and shouldn't appear in new docs.

```mdx
## JavaScript API

The MyComponent plugin handles dismissal and exposes events for integrating with surrounding flows. Chassis JS ships as an ES module — import the `MyComponent` class:

```js
import { MyComponent } from '@chassis-ui/css'
```

### Triggers

The data-attribute API wires up dismissal without writing any JavaScript on the page beyond the bundled plugin:

<JsDismiss name="my-component" />

### Initialization

For programmatic access — calling methods or listening to events — instantiate each element with the `MyComponent` class:

```js
const instances = [...document.querySelectorAll('.my-component')]
  .map(element => new MyComponent(element))
```

### Methods

The plugin exposes instance methods for programmatic control:

<CxTable>
| Method | Description |
| --- | --- |
| `close` | Closes the component by removing it from the DOM. |
| `getInstance` | Static — returns the instance bound to a DOM element, or `null`. |
</CxTable>
```

`### Methods` and `### Events` still need their intro sentence per [§2](#2-every-heading-earns-its-paragraph) — don't let `<CxTable>` immediately follow the heading.

**Section order rationale.** Triggers comes before Initialization since the data-attribute path is simpler and some readers stop there; Methods and Events serve the JS-first audience. If the plugin accepts options, add a `### Options` sub-section between Methods and Events.

### 15. Cross-references

**Within Chassis docs.** Use the `[[docsref:/path/to/doc]]` token inside Markdown link syntax — the build resolves it against the configured docs path at compile time, so the link stays correct across deployments and locales. Append a heading slug to link a sub-section:

```mdx
[position utilities]([[docsref:/utilities/position]])
[the MyComponent JavaScript API]([[docsref:/components/my-component#javascript-api]])
```

**Within the same doc.** Use plain `#anchor` links — IDs are auto-generated from heading text by slugifying (`### ARIA roles` becomes `#aria-roles`). Don't create two headings with the same slug in a doc, and re-verify anchors after renaming a heading — internal links to the old slug silently break.

**External references.** Standard Markdown links. Prefer authoritative sources (W3C, MDN, WAI-ARIA APG) over blog posts.

**Component source.** Link `[scss/_component.scss](scss/_component.scss)` with optional line number `[scss/_component.scss:120](scss/_component.scss:120)`.

### 16. Code formatting in examples

2-space indentation matching the surrounding MDX; classes ordered base → layout modifier → state (`class="my-link active"` not `class="active my-link"`); self-closing void elements (`<input />`) match the existing file's pattern — most docs use unclosed `<input>`, but XHTML-style is also accepted; HTML comments mark sections of long markup (`<!-- Panel body -->`); double quotes for HTML attributes (`href="#"` not `href='#'`).

For the broader code-block conventions (language tags, partial vs full code, fenced blocks outside `<Example>`), see [§17–20](#code-blocks-and-doc-length).

---

## Code blocks and doc length

### 17. Fenced code language tags

Always tag fenced code blocks with the source language — untagged blocks display without highlighting and break the copy-to-clipboard toolbar. Conventions in use:

| Block kind | Language tag | Notes |
| --- | --- | --- |
| HTML markup outside `<Example>` | `` ```html `` | E.g. accessibility callout examples, raw `<svg>` snippets. |
| JavaScript usage | `` ```js `` | Includes ESM imports, instantiation, and event listeners. |
| SCSS | `` ```scss `` | Use for hand-written examples; prefer `<ScssDocs>` for snippets pulled from source. |
| Compiled CSS | `` ```css `` | For showing compiled output by hand; otherwise pass `compile` to `<ScssDocs>` ([§10](#10-the--css-section-template)). |
| Shell commands | `` ```bash `` | Installation, build, and CLI commands. |
| MDX/Markdown | `` ```mdx `` / `` ```md `` | When the styleguide or a meta-doc shows authoring patterns. |

### 18. Partial vs full code

`<Example>` blocks should always be standalone and runnable — a reader copying the code into an empty HTML document should see a working component. Inline `` ```js `` / `` ```html `` snippets in narrative sections (Accessibility, JS API) can be partial — show only the pattern under discussion and don't repeat boilerplate. Prefer working code over comment-only placeholders: `document.getElementById('triggerButton').focus()` beats `// move focus here`.

### 19. Inline code vs code blocks

- **Inline backticks** for single identifiers, attribute names, file paths, and short literal values. `` `.my-component` ``, `` `aria-current="page"` ``, `` `scss/_component.scss` ``.
- **Fenced blocks** for anything that spans multiple lines, or for single lines that the reader will copy and run.

If a one-liner is *demonstrating syntax* rather than something to copy, prefer an inline-code form. If it's *something to run*, prefer a fenced block.

### 20. Document length and splitting

A doc is too long when a `##` section has more than three `###` sub-sections on distinct topics, the doc exceeds ~600 lines of MDX, or the ToC requires scrolling to see all top-level sections. Split along the natural axis: **by component family** (a category covering several sub-topics gets one doc each, linked from a landing page) or **by concern** (theming, deep customization, or migration guidance moves to a sibling concept doc). Don't split for size alone — a 700-line doc that reads end-to-end beats three 200-line stubs that force the reader to chase context across pages.

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
- [ ] Theming placement reflects the component type ([§7](#7-standard-section-order)) — after Layout for variant-light components; right after Basic structure for variant-centric components. Helper docs do not have a Theming section.
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

These conventions exist in practice but haven't been formalized here. To propose one: find at least three docs that already follow (or would benefit from) the pattern, then open a PR adding the section here, citing those docs as evidence — link contested proposals in `.github/` for discussion before merging.

Currently unwritten:

- Convention for documenting JS plugin options (some components have them, none document them consistently).
- Convention for documenting RTL-specific behavior — when to call it out, where to put the note.
- When to introduce a one-off MDX component (e.g. a component-specific placement playground) vs writing prose plus standard `<Example>` blocks.
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
| `name` | `string` | required | Component name (used in the rendered prose and code, e.g. `"my-component"`). |

### `<DocsCSS>`, `<DocsCSSVars>`, `<DocsSASSVars>`, `<DocsDesignTokens>`

Boilerplate paragraph generators for the `## CSS` section. All four take the same shape:

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `component` | `string` | — | Component name in the rendered sentence (`"MyComponent"` → "The MyComponent component…"). Omit for the generic "This component" fallback. |
| `plural` | `boolean` | `false` | Use plural phrasing ("These components" / "Form components"). |
| `exposed` | `boolean` | `false` | `<DocsCSS>` / `<DocsSASSVars>`: marks variables as runtime-overridable via `--cx-` custom properties. `<DocsCSSVars>`: not accepted. |
| `cascading` | `boolean` | `false` | `<DocsCSSVars>` only: appends the cascading-variables explanation and links to the context-class doc. |

Each component renders a single paragraph. Place it directly under the corresponding `###` heading; no manual intro sentence is needed.
