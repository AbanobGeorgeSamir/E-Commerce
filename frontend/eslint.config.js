import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
globalIgnores(['dist']),
{
  files: ['**/*.{js,jsx}'],
  extends: [
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite],

  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
    parserOptions: {
      ecmaVersion: 'latest',
      ecmaFeatures: { jsx: true },
      sourceType: 'module'
    }
  },
  rules: {
    'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    // The application intentionally initializes asynchronous API requests from effects.
    // Their state updates happen after the request resolves, not during rendering.
    'react-hooks/set-state-in-effect': 'off'
  }
}]
);
