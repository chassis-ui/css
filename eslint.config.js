import { defineConfig } from 'eslint/config'
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import importPlugin from 'eslint-plugin-import'
import unicornPlugin from 'eslint-plugin-unicorn'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import markdownPlugin from '@eslint/markdown'
import htmlPlugin from 'eslint-plugin-html'
import astroPlugin from 'eslint-plugin-astro'

export default defineConfig([
  {
    ignores: [
      '**/*.min.js',
      '**/dist/',
      '_site/',
      'js/coverage/',
      'site/.astro/',
      'site/public/',
      'vendor/'
    ]
  },
  eslint.configs.recommended,
  tseslint.configs.eslintRecommended,
  astroPlugin.configs.recommended,
  astroPlugin.configs['jsx-a11y-recommended'],
  prettierPlugin,
  {
    plugins: { import: importPlugin, unicorn: unicornPlugin },
    rules: {
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'prettier/prettier': 'warn'
    }
  },
  {
    files: ['**/*.{ts,mts}', '**/*.astro/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parser: tseslint.parser
    }
  },
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
      parser: astroPlugin.parser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.astro']
      }
    }
  },
  {
    files: ['**/*.astro/*.js', '**/*.astro/*.ts'],
    rules: {
      'prettier/prettier': 'off'
    }
  },
  {
    files: ['build/**'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['js/**'],
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      'import/no-unassigned-import': 'error',
      'no-console': 'error',
      'no-new': 'error',
      'no-script-url': 'error',
      'no-unused-expressions': 'error',
      'no-unused-vars': 'error',
      'prettier/prettier': 'off',
      'unicorn/better-regex': 'error'
    }
  },
  // js/**/*.ts — TypeScript sources, plus the .mts Vitest config
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: ['js/**/*.{ts,mts}'] })),
  {
    files: ['js/**/*.{ts,mts}'],
    rules: {
      // DOM/config plumbing (event registry, config merging) is inherently dynamic
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // js/tests/types/** - compile-time type assertions, never executed
  {
    files: ['js/tests/types/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-new': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['js/**/*.html', '**/*.md/*.html'],
    plugins: { html: htmlPlugin },
    settings: {
      'html/html-extensions': ['.html']
    },
    rules: {
      'no-console': 'off',
      'no-new': 'off'
    }
  },
  {
    files: ['js/tests/*.js', 'js/tests/integration/rollup*.js', 'scss/tests/**/*.{js,cjs}'],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ['js/tests/unit/**'],
    languageOptions: {
      globals: { ...globals.jasmine, ...globals.jquery }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['js/tests/e2e/**'],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['scss/tests/**'],
    languageOptions: {
      globals: { ...globals.jasmine }
    }
  },
  {
    files: ['site/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    files: ['site/static/**/*.js'],
    languageOptions: {
      sourceType: 'script'
    }
  },
  {
    files: ['**/*.md', '**/*.md/*.js'],
    plugins: { markdown: markdownPlugin },
    processor: 'markdown/markdown'
  }
])
