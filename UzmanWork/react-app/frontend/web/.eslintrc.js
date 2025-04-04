module.exports = {
  extends: ["../.eslintrc.js", "plugin:storybook/recommended"],
  settings: {
    // Tells eslint how to resolve imports
    "import/resolver": {
      node: {
        paths: ["src"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    // This is for virtual imports.
    "import/no-unresolved": [
      "error",
      {
        ignore: ["^virtual:"],
      },
    ],
  },
};
