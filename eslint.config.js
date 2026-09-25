import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import ts from 'typescript-eslint';

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', 'dev-dist/**', 'vite.config.js', 'vite.config.d.ts', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  { files: ['**/*.vue'], languageOptions: { parserOptions: { parser: ts.parser } } },
  { languageOptions: { globals: { window: 'readonly', document: 'readonly', console: 'readonly', HTMLElement: 'readonly', MouseEvent: 'readonly', KeyboardEvent: 'readonly', Event: 'readonly', IntersectionObserver: 'readonly', __dirname: 'readonly' } }, rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
);
