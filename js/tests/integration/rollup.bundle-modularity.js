import commonjs from '@rollup/plugin-commonjs'
import configRollup from './rollup.bundle.js'

const config = {
  ...configRollup,
  input: 'js/tests/integration/bundle-modularity.js',
  output: {
    file: 'js/coverage/bundle-modularity.js',
    format: 'iife'
  }
}

config.plugins.unshift(commonjs())

export default config
