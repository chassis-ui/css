export interface TableProps {
  class?: string
  style?: string
  theme?: string
  caption?: string
  headClass?: string
  headStyle?: string
  bodyClass?: string
  bodyStyle?: string
  headRowClass?: string
  active?: boolean
  foot?: boolean
  footClass?: string
}

const tableRows = `    <tr>
      <th scope="row">1</th>
      <td>John</td>
      <td>Smith</td>
      <td>@john</td>
    </tr>
    <tr>
      <th scope="row">2</th>
      <td>Mehmet</td>
      <td>Sarıçizmeli</td>
      <td>@mehmet</td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td>Jane</td>
      <td>Doe</td>
      <td>@jane</td>
    </tr>`

/** Returns the full HTML string for the table example. */
export function getTableHtml(props: TableProps = {}): string {
  const {
    class: className,
    style,
    theme,
    caption,
    headClass,
    headStyle,
    bodyClass,
    bodyStyle,
    headRowClass,
    active,
    foot,
    footClass
  } = props

  const captionHtml = caption ? `  <caption>${caption}</caption>\n` : ''

  const tableFoot = foot
    ? `
  <tfoot${footClass ? ` class="${footClass}"` : ''}>
    <tr>
      <td>Footer 1</td>
      <td>Footer 2</td>
      <td>Footer 3</td>
      <td>Footer 4</td>
    </tr>
  </tfoot>`
    : ''

  const activeRow = active
    ? `    <tr class="active">
      <th scope="row">1</th>
      <td>John</td>
      <td>Smith</td>
      <td>@john</td>
    </tr>
    <tr>
      <th scope="row">2</th>
      <td>Mehmet</td>
      <td class="active">Sarıçizmeli</td>
      <td>@mehmet</td>
    </tr>
    <tr>
      <th scope="row">3</th>
      <td>Jane</td>
      <td>Doe</td>
      <td>@jane</td>
    </tr>`
    : tableRows

  return `<table${className ? ` class="${className}"` : ''}${style ? ` style="${style}"` : ''}${theme ? ` data-cx-theme="${theme}"` : ''}>
${captionHtml}  <thead${headClass ? ` class="${headClass}"` : ''}${headStyle ? ` style="${headStyle}"` : ''}>
    <tr${headRowClass ? ` class="${headRowClass}"` : ''}>
      <th scope="col">#</th>
      <th scope="col">First</th>
      <th scope="col">Last</th>
      <th scope="col">Handle</th>
    </tr>
  </thead>
  <tbody${bodyClass ? ` class="${bodyClass}"` : ''}${bodyStyle ? ` style="${bodyStyle}"` : ''}>
${activeRow}
  </tbody>${tableFoot}
</table>`
}

/** Returns an abbreviated snippet — only customized parts shown, rest collapsed to `...`. */
export function getTableCode(props: TableProps & { simplified?: boolean } = {}): string {
  const {
    class: className,
    style,
    theme,
    caption,
    headClass,
    headStyle,
    bodyClass,
    bodyStyle,
    headRowClass,
    active,
    foot,
    footClass,
    simplified = true
  } = props

  if (!simplified) return getTableHtml(props)

  const captionCode = caption ? `  <caption>${caption}</caption>\n` : ''

  // Only expand thead/tbody/tfoot when at least one of them carries a customization.
  // Otherwise collapse the entire table interior to a single `...`.
  const hasCustomSection =
    headClass || headStyle || headRowClass || bodyClass || bodyStyle || active || foot

  if (!hasCustomSection) {
    return `<table${className ? ` class="${className}"` : ''}${style ? ` style="${style}"` : ''}${theme ? ` data-cx-theme="${theme}"` : ''}>
${captionCode}  ...
</table>`
  }

  const headRowCode = headRowClass
    ? `    <tr class="${headRowClass}">\n      ...\n    </tr>`
    : '    ...'

  const bodyCode = active
    ? `    <tr class="active">\n      ...\n    </tr>\n    <tr>\n      <th scope="row">2</th>\n      <td>Mehmet</td>\n      <td class="active">Sarıçizmeli</td>\n      <td>@mehmet</td>\n    </tr>\n    <tr>\n      ...\n    </tr>`
    : '    ...'

  const footCode = foot
    ? `\n  <tfoot${footClass ? ` class="${footClass}"` : ''}>\n    ...\n  </tfoot>`
    : ''

  return `<table${className ? ` class="${className}"` : ''}${style ? ` style="${style}"` : ''}${theme ? ` data-cx-theme="${theme}"` : ''}>
${captionCode}  <thead${headClass ? ` class="${headClass}"` : ''}${headStyle ? ` style="${headStyle}"` : ''}>
${headRowCode}
  </thead>
  <tbody${bodyClass ? ` class="${bodyClass}"` : ''}${bodyStyle ? ` style="${bodyStyle}"` : ''}>
${bodyCode}
  </tbody>${footCode}
</table>`
}
