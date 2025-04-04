const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/core'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        {
          input: 'libs/common/src/i18n',
          glob: '**/*',
          output: 'i18n',
        },
        {
          input: 'libs/common/src/seed',
          glob: '**/*',
          output: 'seed',
        },
        {
          input: 'libs/common/src/.platform',
          glob: '**/*',
          output: '.platform',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
