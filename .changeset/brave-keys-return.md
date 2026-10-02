---
'@chassis-ui/css': patch
---

Fix the defects the end-to-end tests found in Dialog, Combobox, Menu and Datepicker.

- **Dialog:** Escape pressed repeatedly no longer closes a dialog with `data-cx-keyboard="false"`, and a dialog the browser closes by itself releases the scroll lock of the page and fires `hidden`. A non-modal dialog is centered in the viewport.
- **Combobox:** ArrowDown and ArrowUp on a closed menu leave the focus on the first or the last item. Escape in the input closes the menu. Tab on an item moves on to the next control in Safari.
- **Combobox, Menu:** the arrow keys wrap at the ends of the list, as documented.
- **Menu:** Escape closes the menu when a click left the focus on the page, as Safari does.
- **Datepicker:** `show`, `shown`, `hide` and `hidden` also fire when the calendar opens on a click on its input and closes on Escape or a click outside. The focus returns from the calendar to its trigger when the calendar closes.
