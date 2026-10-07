---
'@chassis-ui/css': patch
---

The grid bundle (`chassis-grid.css`) declares the order of the cascade layers, as the reboot and utilities bundles do. Without the statement its layers were ordered as they appeared, so a bundle loaded after it put `reboot` above `layout` and `utilities`. The statement moved from `scss/_root.scss` to `scss/_layer-order.scss`, which `_root.scss` loads.

The breakpoint and grid custom properties moved to the end of the `:root` rule, which their media query no longer splits in two.
