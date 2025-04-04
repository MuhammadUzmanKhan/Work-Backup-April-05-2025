import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { VitePWA } from "vite-plugin-pwa";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const pwaOptions = {
    // NOTE(@lberg): we are removing the service worker with this,
    // As we don't want it anymore.
    // We can't just remove the plugin, as it would break the browsers
    // that already have the service worker installed.
    selfDestroying: true,
    // This forces skipWaiting and clientsClaim to be true.
    // see https://vite-pwa-org.netlify.app/guide/auto-update.html
    registerType: "autoUpdate",
    // NOTE: we are not setting any runtimeCaching here
    // We will only use default preCaching.
    manifest: {
      name: "Coram",
      short_name: "Coram",
      theme_color: "#ffffff",
      icons: [
        {
          src: "static/favicon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    // see https://github.com/vite-pwa/vite-plugin-pwa/issues/458
    // By default, workbox only caches files under 2MB.
    // Our index is bigger than that, so we miss the cache and render a blank page.
    // As such, we increase the value here to ensure we fit in the cache.
    workbox: {
      maximumFileSizeToCacheInBytes: 10000000,
    },
  };

  if (command === "build") {
    return {
      plugins: [
        react(),
        viteTsconfigPaths(),
        VitePWA({ ...pwaOptions, mode: "production" }),
      ],
      resolve: {
        alias: {
          process: "process/browser",
        },
      },
    };
  } else {
    return {
      plugins: [
        eslint(),
        react(),
        viteTsconfigPaths(),
        VitePWA({
          ...pwaOptions,
          mode: "development",
          devOptions: {
            enabled: false,
          },
        }),
      ],
      optimizeDeps: {
        include: [
          "@mui/material/Tooltip",
          "@emotion/styled",
          "@mui/material/Unstable_Grid2",
        ],
      },
      // We need to add this option to make HMR work from inside docker.
      server: {
        watch: {
          usePolling: true,
        },
      },
      resolve: {
        preserveSymlinks: true,
      },
      define: {
        process: {
          env: {},
        },
      },
    };
  }
});
