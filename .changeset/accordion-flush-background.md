---
'@chassis-ui/css': minor
---

**Breaking:** a flush accordion has no background colors, so it shows the background of its parent. `.accordion.flush` sets `--cx-accordion-item-bg-color`, `--cx-accordion-title-bg-color` and `--cx-accordion-title-bg-active` to `transparent`.

- `$accordion-item-bg-color`, `$accordion-title-bg-color` and `$accordion-title-bg-active` no longer reach a flush accordion. To give one a background, set the custom properties on it, inline or in the `custom` layer.
- An accordion with a context keeps the background colors of its context, flush or not.
