// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "i.ytimg.com",
      "scontent.fgig29-1.fna.fbcdn.net",
      "scontent.flhe10-1.fna.fbcdn.net",
      "scontent.flhe13-1.fna.fbcdn.net",
      "scontent.fabc1-1.fna.fbcdn.net",
      "scontent.fabc2-1.fna.fbcdn.net",
      "scontent.flhe3-1.fna.fbcdn.net",
      "scontent.xx.fbcdn.net",
      "scontent.fna.fbcdn.net",
      "instagram.flhe10-1.fna.fbcdn.net",
      "instagram.flhe13-1.fna.fbcdn.net",
      "instagram.fgig29-1.fna.fbcdn.net",
    ],
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude .js.map files from being processed by webpack
    config.module.rules.push({
      test: /\.js\.map$/,
      use: {
        loader: "ignore-loader", // or any appropriate loader
      },
    });

    return config;
  },
};

export default nextConfig;
