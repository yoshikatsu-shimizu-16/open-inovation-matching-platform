import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import jsdoc from 'eslint-plugin-jsdoc'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist', 'coverage', '.wrangler'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: {
        ...globals.nodeBuiltin,
      },
    },
    plugins: {
      jsdoc,
    },
    rules: {
      'jsdoc/no-blank-blocks': 'error',
      'jsdoc/no-types': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
          ],
          enableFixer: false,
          publicOnly: {
            cjs: false,
            esm: true,
            window: false,
          },
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: false,
          },
        },
      ],
    },
  },
  {
    files: ['**/*.{test,spec}.ts', 'tests/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': 'off',
    },
  },
])
