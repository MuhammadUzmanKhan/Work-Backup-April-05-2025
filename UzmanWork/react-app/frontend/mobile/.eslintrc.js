module.exports = {
  extends: ["../.eslintrc.js"],
  settings: {
    // Tells eslint how to resolve imports
    "import/resolver": {
      node: {
        paths: ["app", "features", "components"],
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
};
