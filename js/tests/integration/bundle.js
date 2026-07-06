import { Tooltip } from '../../../dist/js/chassis.js'

window.addEventListener('load', () => {
  [...document.querySelectorAll('[data-cx-toggle="tooltip"]')]
    .map(tooltipNode => new Tooltip(tooltipNode))
})
