import postcssPrefixCustomProperties from 'postcss-prefix-custom-properties'
import { mergeLayerBlocks } from './postcss.config.js'

// No autoprefixer here: the consumer's own Tailwind build (Lightning CSS)
// handles vendor prefixes when it compiles the imported Chassis CSS.
//
// The extra ignore patterns protect Tailwind's own theme namespaces — the
// `@theme { --*: initial; --breakpoint-*; --container-*; }` reset,
// `--tw-*` runtime variables, and (for the opt-in token bridge,
// scss/tailwind/bridge.scss) the `--color-*` theme keys it declares — from
// being renamed to `--cx-*`, which would stop Tailwind's compiler from
// recognizing them. The bridge's own VALUES (`var(--primary)`) are not
// exempted, so they still get prefixed to the real Chassis token
// (`var(--cx-primary)`) like every other Tailwind entry.
export default (context) => {
  return {
    plugins: [
      postcssPrefixCustomProperties({
        prefix: 'cx-',
        ignore: [/^--cx-/, /^--(breakpoint|container|tw|color)-/, /^--\*$/]
      }),
      mergeLayerBlocks
    ]
  }
}
