# Changesets

A change to what `@chassis-ui/css` publishes adds a changeset: a Markdown file in this folder that
names the version bump (patch, minor or major) and the CHANGELOG text. Run `pnpm changeset` to write
one, or `pnpm changeset --empty` for a change to `scss/`, `js/src/`, `postcss/` or `dist/` that
releases nothing. When `develop` is merged into `main`, the release workflow turns the changesets
into a "Version Packages" pull request; merging it publishes the new version.

See [Releases](../.github/CONTRIBUTING.md#releases) in the contributing guide,
[VERSIONING.md](../VERSIONING.md) for which bump a change needs, and the
[Changesets documentation](https://changesets.dev).
