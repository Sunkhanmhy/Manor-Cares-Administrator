import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Standard "fetch data on mount" pattern (load() sets state from an async
      // effect body) — intentional throughout this app's data-fetching pages.
      'react-hooks/set-state-in-effect': 'off',
      // Context files intentionally export hooks (useAuth, useToast) alongside
      // their providers — standard pattern, harmless for fast refresh.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
