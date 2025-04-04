const baseConfig = require('../../eslint.config.js');
const prettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  ...baseConfig,
  {
    // files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    files: [
      'src/modules/incident/**/*.ts',
      'src/modules/incident/**/*.tsx',
      'src/modules/incident/**/*.js',
      'src/modules/incident/**/*.jsx',
    ],
    plugins: {
      prettier: prettier, // Include the prettier plugin here
      import: importPlugin,
    },
    rules: {
      'no-console': 'warn',
      'prettier/prettier': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      // 'unused-imports/no-unused-imports': 'warn',
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
