---
'@chassis-ui/css': patch
---

No computed color holds the `none` keyword, so axe can measure contrast. White, black and the other colors with no chroma were written with a missing hue, `oklch(100% 0 none)`, which is also the computed value of every element that uses them. axe-core 4.13 cannot parse it: on a page with a white background its `color-contrast` rule stopped with `error-occurred` and reported `incomplete`, so a light page passed the audit without being measured.

- `to-color()` writes a color with no chroma as `oklab()`: `--cx-white` is `oklab(100% 0 0)`, and so are the 172 tokens of `:root` that had `none` in one of their modes. A hue of `0` would not do, since `color-mix(in oklch, …)` interpolates towards it. A browser that converts `oklab(100% 0 0)` to oklch finds no chroma and takes the hue of the other color, as it did with `none`.
- `$solid-bg-even`, `$solid-bg-evident` and the backdrop of `.drawer` mix `in oklab`. In oklch they computed to `oklch(L 0 none)` for a context with no chroma, whatever the tokens say. With black or `transparent` as the other color, the two spaces give the same color.

Nothing changes on screen. A project that interpolates one of these tokens `in hsl` or `in hwb` (the framework does not) gets a slightly different color from the mix: there a missing hue and a color with no chroma are not the same thing to the browsers.
