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
      // Local files that git ignores, a checkout of the repository in .claude/worktrees/ among them
      '.claude/',
      '**/*.min.js',
      '**/dist/',
      '_site/',
      'packages/css/js/coverage/',
      // What a Playwright run leaves: Markdown and HTML that are not source
      'packages/css/playwright-report/',
      'packages/css/test-results/',
      'packages/site/.astro/',
      'packages/site/public/',
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
    files: ['build/**', 'packages/css/build/**'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module'
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['packages/css/js/**'],
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
  // packages/css/js/**/*.ts — TypeScript sources, plus the .mts Vitest config
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['packages/css/js/**/*.{ts,mts}']
  })),
  {
    files: ['packages/css/js/**/*.{ts,mts}'],
    rules: {
      // DOM/config plumbing (event registry, config merging) is inherently dynamic
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  // packages/css/js/tests/types/** - compile-time type assertions, never executed
  {
    files: ['packages/css/js/tests/types/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-new': 'off',
      'no-unused-expressions': 'off'
    }
  },
  {
    files: ['packages/css/js/**/*.html', '**/*.md/*.html', 'packages/css/scss/tests/**/*.html'],
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
    files: [
      'packages/css/js/tests/*.js',
      'packages/css/js/tests/integration/rollup*.js',
      'packages/css/scss/tests/**/*.{js,cjs}'
    ],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ['packages/css/js/tests/unit/**'],
    languageOptions: {
      globals: { ...globals.jasmine, ...globals.jquery }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['packages/css/js/tests/e2e/**'],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      'no-console': 'off'
    }
  },
  {
    files: ['packages/css/scss/tests/**'],
    languageOptions: {
      globals: { ...globals.jasmine }
    }
  },
  {
    files: ['packages/site/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser }
    }
  },
  {
    files: ['packages/site/static/**/*.js'],
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
