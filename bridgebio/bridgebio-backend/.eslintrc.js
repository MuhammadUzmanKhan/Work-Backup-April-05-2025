module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint/eslint-plugin',
    '@stylistic',
    '@stylistic/js',
    'unused-imports',
    'newline-destructuring',
    "imports-destructuring-newline",
    "class-methods-preprocessors"
  ],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    "unused-imports/no-unused-imports": "warn",
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/semi": "warn",
    "@stylistic/js/block-spacing": "warn",
    "@stylistic/js/arrow-spacing": "warn",
    "@stylistic/js/brace-style": "warn",
    "@stylistic/js/comma-spacing": [
      "warn",
      { "before": false, "after": true }],
    "@stylistic/js/indent": ["warn", 4, {
      "ignoredNodes": [
        `FunctionExpression > .params[decorators.length > 0]`,
        `FunctionExpression > .params > :matches(Decorator, :not(:first-child))`,
        `ClassBody.body > PropertyDefinition[decorators.length > 0] > .key`,
      ],
    }],
    "@stylistic/js/padding-line-between-statements": [
      "warn",
      { "blankLine": "always", "prev": ["block", "block-like", "let", "const", "function"], "next": ["return", "block", "block-like"] },
      { "blankLine": "never", "prev": ["let", "const"], "next": ["let", "const"] },
      { "blankLine": "always", "prev": ["let", "const"], "next": ["function", "block", "block-like"] },
    ],
    "@stylistic/js/padded-blocks": ["error", "never"],
    "@stylistic/js/no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1, "maxBOF": 0, }],
    "@stylistic/js/object-curly-newline": ["warn", {
      "ObjectExpression": { "multiline": true, "minProperties": 3, "consistent": true },
      "ObjectPattern": { "multiline": true, "minProperties": 3, "consistent": true },
      "ImportDeclaration": { "multiline": true, "minProperties": 5, "consistent": true },
      "ExportDeclaration": { "multiline": true, "minProperties": 5, "consistent": true }
    }],
    "@stylistic/js/object-property-newline": ["error", {
      "allowAllPropertiesOnSameLine": false
    }],
    "@stylistic/js/comma-dangle": ["error", "never"],
    "newline-destructuring/newline": ["error", {
      "items": 2
    }],
    "imports-destructuring-newline/import-declaration-newline": ["warn", {
      "minProperties": 5
    }],
    "imports-destructuring-newline/export-declaration-newline": ["warn"],
    "class-methods-preprocessors/enforce-methods-preprocessors": "warn"
  },
};