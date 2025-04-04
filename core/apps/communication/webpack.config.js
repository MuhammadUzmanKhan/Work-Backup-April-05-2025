const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/communication'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      assets: [
        {
          input: './src/modules/email/hbs',
          glob: '**/*',
          output: 'hbs',
        },
        {
          input: 'libs/common/src/.platform',
          glob: '**/*',
          output: '.platform',
        },
      ],
    }),
  ],
};
