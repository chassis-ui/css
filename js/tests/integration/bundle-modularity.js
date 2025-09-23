/* eslint-disable import/no-unassigned-import */

import Tooltip from '../../dist/tooltip'
import '../../dist/carousel'

window.addEventListener('load', () => {
  [].concat(...document.querySelectorAll('[data-cx-toggle="tooltip"]'))
    .map(tooltipNode => new Tooltip(tooltipNode))
})
