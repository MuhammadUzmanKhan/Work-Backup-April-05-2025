const path = require("path");
const fs = require("fs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// Generate pages object
const pages = {};

function getEntryFile(entryPath) {
  let files = fs.readdirSync(entryPath);
  return files;
}

const chromeName = getEntryFile(path.resolve(`src/entry`));

function getFileExtension(filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined;
}

chromeName.forEach((name) => {
  const fileExtension = getFileExtension(name);
  const fileName = name.replace("." + fileExtension, "");
  pages[fileName] = {
    entry: `src/entry/${name}`,
    template: "public/index.html",
    filename: `${fileName}.html`,
  };
});

const isDevMode = ["development", "production"].includes(process.env.NODE_ENV);

module.exports = {
  pages,
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugin("copy").use(CopyWebpackPlugin, [
      {
        patterns: [
          {
            from: path.resolve(`src/manifest.${process.env.NODE_ENV}.json`),
            to: `${path.resolve("dist")}/manifest.json`,
          },
          {
            from: path.resolve(`src/assets/styles/ps-upwork.css`),
            to: `${path.resolve("dist")}/ps-upwork.css`,
          },
          {
            from: path.resolve(`src/assets/images`),
            to: `${path.resolve("dist")}/src/assets/images`,
            globOptions: {
              dot: true,
              gitignore: true,
              ignore: ["**/*.DS_Store"],
            },
          },
        ],
      },
    ]);
    config.plugin("define").tap((args) => {
      let v = JSON.stringify(require("./package.json").version);
      args[0]["process.env"]["VUE_APP_VERSION"] = v;
      return args;
    });
  },
  configureWebpack: {
    output: {
      filename: `js/[name].js`,
      chunkFilename: `[name].js`,
    },
    devtool: isDevMode ? "inline-source-map" : false,
    performance: {
      maxAssetSize: 100048576, // 100 MB
      maxEntrypointSize: 100048576, // 100 MB
    },
  },
};
