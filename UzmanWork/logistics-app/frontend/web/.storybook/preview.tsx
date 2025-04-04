import { CssBaseline, ThemeProvider } from "@mui/material";
import type { Preview } from "@storybook/react";
import { initialize, mswDecorator } from "msw-storybook-addon";
import { UserRole } from "coram-common-utils";
import { RTL } from "../src/components/devias/rtl";
import { SettingsConsumer } from "../src/contexts/settings-context";
import feature_handler from "../src/mocks/feature_handler";

import {
  DefaultOrganizationDecorator,
  DefaultOrganizationProviderDecorator,
  LocalizationProviderDecorator,
  QueryClientDecorator,
  RecoilDecorator,
  RoleContextProviderDecorator,
  RouterDecorator,
  SentryDecorator,
  SettingsContextDecorator,
  TriageDragProviderDecorator,
} from "../src/stories/Decorators";
import { createTheme } from "../src/theme";

// Initialize MSW, which is used for mocking out API calls
initialize({
  quiet: true,
  onUnhandledRequest: ({ method, url }) => {
    if (
      url.pathname.startsWith("/src") ||
      url.pathname.startsWith("/.storybook") ||
      url.pathname.startsWith("/node_modules") ||
      url.pathname.startsWith("/static") ||
      url.pathname.startsWith("/virtual") ||
      url.pathname.startsWith("/sb-common") ||
      url.toString() === "http://localhost:6006/"
    ) {
      return;
    }
    console.error(`Unhandled ${method} request to ${url}.

      This exception has been only logged in the console, however, it's strongly recommended to resolve this error as you don't want unmocked data in Storybook stories.

      If you wish to mock an error response, please refer to this guide: https://mswjs.io/docs/recipes/mocking-error-responses
    `);
  },
});

const preview: Preview = {
  globalTypes: {
    role: {
      name: "role",
      description: "The role of the user",
      defaultValue: UserRole.ADMIN,
      toolbar: {
        icon: "account_circle",
        items: [
          UserRole.ADMIN,
          UserRole.REGULAR,
          UserRole.LIMITED,
          UserRole.LIVE_ONLY,
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    msw: {
      handlers: feature_handler,
    },
  },
  decorators: [
    mswDecorator,
    RouterDecorator,
    SentryDecorator,
    RoleContextProviderDecorator,
    DefaultOrganizationDecorator,
    RecoilDecorator,
    DefaultOrganizationProviderDecorator,
    QueryClientDecorator,
    LocalizationProviderDecorator,
    TriageDragProviderDecorator,
    SettingsContextDecorator,
    (Story) => (
      <>
        <SettingsConsumer>
          {({ settings }) => (
            <ThemeProvider
              theme={createTheme({
                direction: settings.direction,
                responsiveFontSizes: settings.responsiveFontSizes,
                mode: settings.theme,
              })}
            >
              <RTL direction={settings.direction}>
                <CssBaseline />
                <Story />
              </RTL>
            </ThemeProvider>
          )}
        </SettingsConsumer>
      </>
    ),
  ],
};

export default preview;
