// What axe finds on the pages of js/tests/visual/ today, recorded so that the check passes and
// a new violation fails it. Nothing here is accepted: each entry is a defect to fix, and the
// entry goes with the fix. The test also fails on a number that is higher than what it finds,
// so the list cannot hold more than is there.

export interface KnownViolation {
  /** A page, or a page and one of its states: `combobox, menu open` */
  where: string
  rule: string
  /** How many elements break the rule */
  elements: number
  /** Where the fix belongs */
  source: 'plugin' | 'css' | 'dependency' | 'page'
  reason: string
}

// Rules that are left out, with the reason
export const DISABLED_RULES: Record<string, string> = {
  // Until the colors of the dark theme are decided on: the `info` color on dark backgrounds
  // and the days outside the month of the calendar are below 4.5:1
  'color-contrast': 'Left out for now',
  // The pages are there to try a plugin, not documents: no <main>, text outside landmarks
  region: 'About the page, not about a component',
  'landmark-one-main': 'About the page, not about a component',
  'page-has-heading-one': 'About the page, not about a component'
}

export const KNOWN_VIOLATIONS: KnownViolation[] = [
  {
    where: 'combobox, menu open',
    rule: 'aria-allowed-attr',
    elements: 1,
    source: 'plugin',
    reason:
      'With an input trigger the toggle is a <div> without a role, and Combobox sets ' +
      '`aria-expanded` on it. The state belongs on the element with the role `combobox`'
  },
  {
    where: 'combobox, search open',
    rule: 'aria-required-children',
    elements: 1,
    source: 'plugin',
    reason:
      'The search field is inside the menu, which the docs give `role="listbox"`: a listbox ' +
      'holds options and groups only'
  },
  {
    where: 'datepicker, calendar open',
    rule: 'aria-required-children',
    elements: 1,
    source: 'dependency',
    reason: 'The grid of vanilla-calendar-pro has children that `role="grid"` does not allow'
  },
  {
    where: 'tooltip',
    rule: 'aria-prohibited-attr',
    elements: 1,
    source: 'plugin',
    reason:
      'Tooltip moves the `title` of its target to `aria-label`; the target of this example ' +
      'is a <div> without a role, which cannot have one'
  },
  {
    where: 'tooltip, tooltip shown',
    rule: 'aria-prohibited-attr',
    elements: 1,
    source: 'plugin',
    reason: 'The same element as on the page before a tooltip is shown'
  },
  {
    where: 'carousel',
    rule: 'scrollable-region-focusable',
    elements: 1,
    source: 'css',
    reason:
      '`.carousel-inner` scrolls and nothing in it takes the focus; the carousel of the page ' +
      'has no instance until a control is used'
  },
  {
    where: 'collapse',
    rule: 'aria-required-children',
    elements: 1,
    source: 'page',
    reason: 'The page gives the accordion of collapses the roles of tabs, from an older pattern'
  },
  {
    where: 'collapse',
    rule: 'aria-required-parent',
    elements: 4,
    source: 'page',
    reason: 'The page gives the accordion of collapses the roles of tabs, from an older pattern'
  },
  {
    where: 'input',
    rule: 'label',
    elements: 12,
    source: 'page',
    reason: 'The inputs of the page have no label'
  },
  {
    where: 'menu, menu open',
    rule: 'label',
    elements: 1,
    source: 'page',
    reason: 'The text field in the menu of the page has no label'
  }
]
