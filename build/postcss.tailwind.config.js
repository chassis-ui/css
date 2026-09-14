import postcssPrefixCustomProperties from 'postcss-prefix-custom-properties'
import { mergeLayerBlocks } from './postcss.config.js'

// No autoprefixer here: the consumer's own Tailwind build (Lightning CSS)
// handles vendor prefixes when it compiles the imported Chassis CSS.
//
// The extra ignore patterns protect Tailwind's own theme namespaces — the
// `@theme { --*: initial; --breakpoint-*; --container-*; }` reset and
// `--tw-*` runtime variables — from being renamed to `--cx-*`, which would
// stop Tailwind's compiler from recognizing them.
export default (context) => {
  return {
    plugins: [
      postcssPrefixCustomProperties({
        prefix: 'cx-',
        ignore: [/^--cx-/, /^--(breakpoint|container|tw)-/, /^--\*$/]
      }),
      mergeLayerBlocks
    ]
  }
}
