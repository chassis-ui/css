import Tooltip from '../../dist/tooltip.js'
import '../../dist/carousel.js' // eslint-disable-line import/no-unassigned-import

window.addEventListener('load', () => {
  [...document.querySelectorAll('[data-cx-toggle="tooltip"]')]
    .map(tooltipNode => new Tooltip(tooltipNode))
})
