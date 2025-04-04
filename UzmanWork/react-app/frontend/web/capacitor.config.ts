import { CapacitorConfig } from "@capacitor/cli";

let config: CapacitorConfig;
const baseConfig: CapacitorConfig = {
  appId: "com.coramai.coram",
  appName: "Coram",
  webDir: "dist",
  bundledWebRuntime: false,
  includePlugins: [
    "@capacitor/android",
    "@capacitor/app",
    "@capacitor/browser",
    "@capacitor/core",
    "@capacitor/ios",
    "@capacitor/screen-orientation",
    "@capacitor/splash-screen",
  ],
};
if (process.env.NATIVE_APP_BUILD) {
  // Proper build
  config = {
    ...baseConfig,
  };
} else {
  config = {
    ...baseConfig,
    server: {
      url: "http://localhost:5173",
      cleartext: true,
    },
  };
}

export default config;
