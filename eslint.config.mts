import js from '@eslint/js';
import ts from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig(
  {
    ignores: ['**/dist', 'node_modules', 'eslint.config.mjs', '**/vitest.config.ts'],
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: ts.parser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': ts.plugin,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      '@angular-eslint': angular.tsPlugin,
    },
    processor: angular.processInlineTemplates,
    extends: [
      js.configs.recommended,
      ts.configs.recommended,
      ts.configs.stylistic,
      angular.configs.tsRecommended,
      eslintConfigPrettier,
      {
        rules: {
          '@typescript-eslint/no-inferrable-types': 'off',
          'eol-last': ['error', 'always'],
          'no-trailing-spaces': [
            'error',
            {
              skipBlankLines: false,
              ignoreComments: false,
            },
          ],
          'lines-between-class-members': 'error',
          '@typescript-eslint/no-useless-constructor': 'off',
          '@typescript-eslint/no-extraneous-class': 'off',
          '@typescript-eslint/array-type': [
            'warn',
            {
              default: 'array',
              readonly: 'array',
            },
          ],
          '@typescript-eslint/no-explicit-any': 'error',
          '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
          '@typescript-eslint/consistent-type-definitions': ['warn', 'interface'],
          '@typescript-eslint/typedef': [
            'error',
            {
              arrowParameter: true,
              parameter: true,
            },
          ],
          '@typescript-eslint/naming-convention': [
            'error',
            {
              selector: 'interface',
              format: ['PascalCase'],
              prefix: ['I'],
            },
            {
              selector: 'typeAlias',
              format: ['PascalCase'],
              suffix: ['Type'],
            },
            {
              selector: 'enum',
              format: ['PascalCase'],
              suffix: ['Enum'],
            },
          ],
          '@typescript-eslint/no-magic-numbers': [
            'error',
            {
              ignore: [-1, 0, 1, 2, 3, 5, 10, 60, 100, 1000],
              ignoreArrayIndexes: true,
              enforceConst: true,
              detectObjects: false,
              ignoreDefaultValues: true,
              ignoreNumericLiteralTypes: true,
              ignoreReadonlyClassProperties: true,
              ignoreEnums: true,
            },
          ],
          'max-len': [
            'error',
            120,
            2,
            {
              ignoreUrls: true,
              ignoreComments: false,
              ignoreRegExpLiterals: true,
              ignoreStrings: true,
              ignoreTemplateLiterals: true,
            },
          ],
          'sort-imports': 'off',
          'import/order': 'off',
          'simple-import-sort/imports': 'error',
          'simple-import-sort/exports': 'error',
          'no-multiple-empty-lines': [
            1,
            {
              max: 1,
            },
          ],
          'no-unused-vars': 'off',
          '@typescript-eslint/no-unused-vars': 'off',
          'unused-imports/no-unused-imports': 'error',
          'unused-imports/no-unused-vars': [
            'error',
            {
              vars: 'all',
              varsIgnorePattern: '^_',
              args: 'after-used',
              argsIgnorePattern: '^_',
            },
          ],
          'class-methods-use-this': [0],
        },
      },
    ],
  },
);
