import postcssPrefixCustomProperties from 'postcss-prefix-custom-properties'
import autoprefixer from 'autoprefixer'

const mapConfig = {
  inline: false,
  annotation: true,
  sourcesContent: true
}

// Strip vendor-prefixed declarations Autoprefixer emits that are dead weight for
// our `.browserslistrc` targets. Each is verified unprefixed-supported across every
// target, with the unprefixed declaration always emitted alongside; we drop them
// here because caniuse-lite still flags the feature so Autoprefixer can't be told
// to skip them via config.
//   - `-webkit-mask-*`: unprefixed since Safari 15.4 (keep `-webkit-mask-box-image`,
//     the `mask-border` translation, which genuinely still needs the prefix).
//   - `-moz-column-gap`: Firefox shipped unprefixed `column-gap` in Firefox 61.
//   - `-webkit-/-moz-transition`: transitions have been unprefixed everywhere for years
//     (only added here because the rule sits inside a `::-webkit-/-moz-` pseudo).
const removeRedundantPrefixes = {
  postcssPlugin: 'remove-redundant-prefixes',
  OnceExit(root) {
    root.walkDecls((decl) => {
      const { prop } = decl
      if (
        (prop.startsWith('-webkit-mask') && !prop.startsWith('-webkit-mask-box-image')) ||
        prop === '-moz-column-gap' ||
        prop === '-webkit-transition' ||
        prop === '-moz-transition'
      ) {
        decl.remove()
      }
    })
  }
}

// Merge consecutive (and non-consecutive) top-level @layer blocks that share
// the same name into a single block. The CSS cascade is unaffected because
// the spec already treats multiple same-named layer blocks as one layer;
// this just makes the output cleaner and smaller.
const mergeLayerBlocks = {
  postcssPlugin: 'postcss-merge-layer-blocks',
  OnceExit(root) {
    const seen = new Map()
    for (const node of [...root.nodes]) {
      if (node.type !== 'atrule' || node.name !== 'layer' || !node.nodes) continue
      const key = node.params
      if (seen.has(key)) {
        const first = seen.get(key)
        node.each((child) => first.append(child.clone()))
        node.remove()
      } else {
        seen.set(key, node)
      }
    }
  }
}

export default (context) => {
  return {
    map: mapConfig,
    plugins: [
      postcssPrefixCustomProperties({
        prefix: 'cx-',
        ignore: [/^--cx-/]
      }),
      autoprefixer({ cascade: false }),
      removeRedundantPrefixes,
      mergeLayerBlocks
    ]
  }
}
