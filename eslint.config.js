import js from '@eslint/js';
import next from '@next/eslint-plugin-next';

export default [
  {
    // research/** holds design-exploration artifacts (Node generation scripts,
    // HTML studies) — not app code; never lint it.
    ignores: ['.next/**', 'node_modules/**', 'public/**', 'next.config.js', 'postcss.config.js', 'scripts/**', 'research/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  {
    plugins: {
      '@next/next': next,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
      // Prism Light: the legacy dark/light ThemeContext is torn down. Don't
      // re-introduce theme reads — use the design-system tokens / prism library.
      'no-restricted-imports': ['error', {
        paths: [{
          name: '@/src/context/ThemeContext',
          importNames: ['useTheme'],
          message: 'useTheme was removed. Use Prism Light tokens (var(--…)) or src/components/prism instead.',
        }],
      }],
    },
  },
];
