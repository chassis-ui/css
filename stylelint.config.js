const forbiddenGenericClasses = [
  '2xlarge',
  'xlarge',
  'large',
  'medium',
  'small',
  'xsmall',
  '2xsmall',
  'default',
  'alternate',
  'primary',
  'secondary',
  'neutral',
  'danger',
  'success',
  'warning',
  'info',
  'black',
  'white',
  'light',
  'dark',
  'basic',
  'solid',
  'outline',
  'fluid',
  'flush',
  'plain',
  'horizontal',
  'vertical'
]

// This maps the words into the regex format: /(^|\s)\.word($|\s)/
const disallowedPatternList = forbiddenGenericClasses.map((name) => `/(^|\\s)\\.${name}($|\\s)/`)

export default {
  extends: ['stylelint-config-twbs-bootstrap'],
  ignoreFiles: [
    '**/*.min.css',
    '**/dist/**',
    '**/tests/**',
    '**/coverage/**',
    '_site/**',
    'site/.astro/**',
    'site/public/**',
    'site/static/**',
    'vendor/**'
  ],
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  overrides: [
    {
      files: ['**/*.scss'],
      rules: {
        'selector-disallowed-list': [
          disallowedPatternList,
          {
            message: (selector) =>
              `The generic class "${selector}" is not allowed. Please qualify it (e.g., .button${selector}) or use a more specific name.`
          }
        ],
        'declaration-property-value-disallowed-list': {
          border: 'none',
          outline: 'none'
        },
        'function-disallowed-list': ['lighten', 'darken'],
        'property-disallowed-list': [
          'font-size',
          'border-radius',
          'border-top-left-radius',
          'border-top-right-radius',
          'border-bottom-right-radius',
          'border-bottom-left-radius',
          'border-start-start-radius',
          'border-start-end-radius',
          'border-end-start-radius',
          'border-end-end-radius',
          'transition',
          'padding-left',
          'padding-right',
          'padding-top',
          'padding-bottom',
          'margin-left',
          'margin-right',
          'margin-top',
          'margin-bottom'
        ],
        'scss/at-function-named-arguments': ['never', { ignoreFunctions: ['if'] }],
        'scss/dollar-variable-default': [true, { ignore: 'local' }],
        'scss/selector-no-union-class-name': true
      }
    },
    {
      files: ['scss/**/*.{test,spec}.scss'],
      rules: {
        'scss/dollar-variable-default': null,
        'declaration-no-important': null
      }
    },
    {
      files: ['site/**/*.scss'],
      rules: {
        'scss/dollar-variable-default': null
      }
    }
  ]
}
