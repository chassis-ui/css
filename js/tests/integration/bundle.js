import { Tooltip } from '../../../dist/js/chassis.esm.js'

window.addEventListener('load', () => {
  [].concat(...document.querySelectorAll('[data-cx-toggle="tooltip"]'))
    .map(tooltipNode => new Tooltip(tooltipNode))
})
