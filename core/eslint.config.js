const nx = require('@nx/eslint-plugin');

module.exports = [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-inline-comments': 'off', // Disable the rule that disables inline comments
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unsafe-optional-chaining': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      'no-prototype-builtins': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'no-constant-condition': 'off',
      'no-constant-binary-expression': 'off',
      'no-extra-boolean-cast': 'off',
      'no-useless-escape': 'off',
      'max-len': [
        'error',
        {
          code: 10000000, // Set to what ever you desire
          tabWidth: 4, // Set to what ever you desire

          /* The two rules below are important, they configure ESLint such that
           the value you assign to the `"code": 80` field above doesn't apply
           to inline comments. So your inline comment won't get chopped at, or
           moved if it is too long. Set the following two fields to `true`. */

          ignoreTrailingComments: true,
          ignoreComments: true,
        },
      ],
    },
  },
];
