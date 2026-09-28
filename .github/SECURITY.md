# Security Policy

## Supported versions

`@chassis-ui/css` is pre-1.0. Only the latest published version gets fixes; there are no
maintenance branches for older versions.

The package ships CSS, Sass source and the JavaScript plugins, and has no runtime dependencies of
its own (`@floating-ui/dom` and `vanilla-calendar-pro` are peer dependencies). The build scripts
in `build/` and `packages/css/build/` and the documentation site run on contributors' machines
and in CI.

## What to report

The part of the package that runs in your users' browsers is the JavaScript in `js/src/`
(`packages/css/js/src/` in the repository). Two kinds of plugin insert HTML. `Tooltip` and `Popover` pass their HTML content through the sanitizer
in `js/src/util/sanitizer.ts` unless `sanitize` is turned off in code; `sanitize`, `allowList` and
`sanitizeFn` cannot be set from `data-cx-*` attributes. `NavOverflow` always sanitizes the icon
markup it copies into its menu. A way to run script or inject markup past the sanitizer with its
default settings, or through any plugin option set from a data attribute, is a vulnerability. So
is a published file that differs from what the source in this repository builds.

The CSS, its custom properties and the Sass output are not expected to carry risk; if you find a
case where they do, report it the same way.

## Reporting a vulnerability

**Please don't open a public GitHub issue for a security vulnerability.**

Instead, use GitHub's private vulnerability reporting for this repository:
[github.com/chassis-ui/css/security/advisories/new](https://github.com/chassis-ui/css/security/advisories/new).
This opens a private thread visible only to you and the maintainers, so a fix can be released
before any public write-up.

If you can't use GitHub's private reporting, open a regular issue asking a maintainer to reach out
for a private channel, without including any details of the vulnerability.

We'll acknowledge new reports and keep you updated while we investigate and fix a confirmed issue.
Please give us reasonable time to release a fix before any public disclosure.
