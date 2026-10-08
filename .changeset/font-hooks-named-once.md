---
'@chassis-ui/css': patch
---

**Breaking:** the custom properties that set the font of a card title, a card subtitle, a drawer title and the datepicker header had the name of the element twice. They are named as the ones of `.card.lg` and of the modal are:

| Before                                                                          | Now                                                           |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `--cx-card-title-title-font-*`, `--cx-card-title-title-line-height`             | `--cx-card-title-font-*`, `--cx-card-title-line-height`       |
| `--cx-card-subtitle-subtitle-font-*`, `--cx-card-subtitle-subtitle-line-height` | `--cx-card-subtitle-font-*`, `--cx-card-subtitle-line-height` |
| `--cx-drawer-title-title-font-*`, `--cx-drawer-title-title-line-height`         | `--cx-drawer-title-font-*`, `--cx-drawer-title-line-height`   |
| `--cx-datepicker-header-header-font-size`, `-font-weight`                       | `--cx-datepicker-header-font-size`, `-font-weight`            |

A project that set one of the old names sets the new one. `font-*` is `font-family`, `font-size` and `font-weight`.
