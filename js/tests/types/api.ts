/**
 * --------------------------------------------------------------------------
 * Chassis CSS type-level API tests
 * Licensed under MIT (https://github.com/chassis-ui/css/blob/main/LICENSE)
 * --------------------------------------------------------------------------
 * Compile-time assertions for the public TypeScript API. This file is only
 * type-checked (`pnpm js:typecheck`); it is never executed or bundled.
 */

import {
  Accordion,
  Carousel,
  ChipInput,
  Collapse,
  Combobox,
  Datepicker,
  Dialog,
  Drawer,
  Menu,
  Popover,
  Toast,
  Tooltip
} from '../../index.js'
import BaseComponent from '../../src/base-component.js'
import EventHandler from '../../src/dom/event-handler.js'
import SelectorEngine from '../../src/dom/selector-engine.js'
import type { CarouselConfig } from '../../src/carousel.js'
import type { CollapseConfig } from '../../src/collapse.js'
import type { ComboboxConfig } from '../../src/combobox.js'
import type { DatepickerConfig } from '../../src/datepicker.js'
import type { DrawerConfig } from '../../src/drawer.js'
import type { MenuConfig } from '../../src/menu.js'
import type { ToastConfig } from '../../src/toast.js'
import type { TooltipConfig } from '../../src/tooltip.js'

declare const element: HTMLElement

// Constructors accept a selector, an element, or nothing, plus a partial config
const tooltipFromSelector: Tooltip = new Tooltip('#tip', { animation: false })
const tooltipFromElement: Tooltip = new Tooltip(element)
const toast: Toast = new Toast(element, { autohide: false, delay: 5000 })
const collapse: Collapse = new Collapse(element, { parent: '#accordion' })
const carousel: Carousel = new Carousel(element, { interval: 2000 })
const dialog: Dialog = new Dialog(element, { modal: true, keyboard: false })
const drawer: Drawer = new Drawer(element, { scroll: true })
const popover: Popover = new Popover(element, { content: 'Hello', animation: true })
const menu: Menu = new Menu(element, { placement: 'bottom-start' })
const combobox: Combobox = new Combobox(element, { multiple: true, placeholder: 'Pick one' })
const chipInput: ChipInput = new ChipInput(element, { separator: ';', maxChips: 5 })

// Accordion takes no config - it's driven entirely by the <details> element
const accordion: Accordion = new Accordion(element)

// Datepicker's config stays plain string/number (not Vanilla Calendar Pro's
// narrower literal unions) - the field is an intentional pass-through, see
// Phase 8's write-up in .claude/ts-migration-plan.md
const datepicker: Datepicker = new Datepicker(element, {
  displayMonthsCount: 2,
  firstWeekday: 1,
  selectionMode: 'multiple-ranged',
  placement: 'center',
  dateMin: '2026-01-01'
})

// Static helpers resolve to the concrete component type, and are nullable
const maybeTooltip: Tooltip | null = Tooltip.getInstance('#tip')
const createdToast: Toast = Toast.getOrCreateInstance(element)
const baseInstance: BaseComponent | null = BaseComponent.getInstance(element)

// @ts-expect-error - getInstance may return null; using it directly must fail
maybeTooltip.show()

// Static metadata
const version: string = Tooltip.VERSION
const name: string = Toast.NAME
const dataKey: string = Collapse.DATA_KEY
const eventKey: string = Carousel.EVENT_KEY
const eventName: string = Toast.eventName('show')

// Default objects are typed with each component's config shape
const tooltipDefault: TooltipConfig = Tooltip.Default
const toastDefault: ToastConfig = Toast.Default
const collapseDefault: CollapseConfig = Collapse.Default
const carouselDefault: CarouselConfig = Carousel.Default
const drawerDefault: DrawerConfig = Drawer.Default
const menuDefault: MenuConfig = Menu.Default
const comboboxDefault: ComboboxConfig = Combobox.Default
const datepickerDefault: DatepickerConfig = Datepicker.Default
const tooltipDelay: number | { show: number, hide: number } = tooltipDefault.delay

// Instance API - show/hide/toggle stay synchronous (chassis deliberately did
// not adopt Bootstrap's async/Promise-returning rewrite during the type
// migration, see the Phase 5-8 write-ups)
const toggled: void = tooltipFromElement.toggle()
const shown: void = collapse.show()
const hidden: void = drawer.hide()
const dialogToggled: void = dialog.toggle()
const comboboxToggled: void = combobox.toggle()
const datepickerShown: void = datepicker.show()
const menuHidden: void = menu.hide()

// @ts-expect-error - show()/hide()/toggle() resolve to void, not a promise
const wrongResolution: Promise<void> = collapse.show()

// EventHandler.trigger is non-null for a non-null element…
const triggered: Event = EventHandler.trigger(element, 'shown.cx.tooltip')
// …and nullable when the element may be null
const maybeTriggered: Event | null = EventHandler.trigger(document.getElementById('x'), 'x')

// SelectorEngine defaults to HTMLElement and accepts narrowing generics
const found: HTMLElement[] = SelectorEngine.find('.item')
const foundOne: HTMLElement | null = SelectorEngine.findOne('.item', element)
const inputs: HTMLInputElement[] = SelectorEngine.find<HTMLInputElement>('input')

// @ts-expect-error - unknown config keys are rejected
new Toast(element, { autohype: true })

// @ts-expect-error - config value types are enforced
new Collapse(element, { parent: 42 })

// @ts-expect-error - ChipInput's chip elements array is typed HTMLElement[]
chipInput.selectChip('not-an-element')

// getOrCreateInstance types its config per component, not just the constructor
Toast.getOrCreateInstance(element, { autohide: false })

// @ts-expect-error - unknown keys are rejected on the static path too
Toast.getOrCreateInstance(element, { autohype: true })

// Internals are protected: consumers cannot reach a component's private state
// @ts-expect-error - _config is protected
tooltipFromElement._config
// @ts-expect-error - _element is protected
toast._element
// @ts-expect-error - internal methods are protected
carousel._getItems()
