import { useAuth0 } from "@auth0/auth0-react";
import { App as CapApp } from "@capacitor/app";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { FeatureFlags, OpenAPI } from "coram-common-utils";
import { AppLayout, MobileInnerPageLayout, SimpleAppLayout } from "components/AppLayout";
import { Auth0ProviderWithNavigate } from "components/auth/Auth0ProviderWithNavigate";
import { RTL } from "components/devias/rtl";
import { DesktopOnly } from "components/layout/DesktopOnly";
import { MobileOnly, NativeOnly } from "components/layout/MobileOnly";
import { SettingsConsumer, SettingsProvider } from "contexts/settings-context";
import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  createRoutesFromElements,
  matchRoutes,
  Navigate,
  Route,
  RouterProvider,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
} from "react-router-dom";
import { RecoilRoot } from "recoil";
import { createTheme } from "theme";

import * as Sentry from "@sentry/react";
import { NoSleep } from "components/NoSleep";
import { RequireAuth } from "components/RequireAuth";
import { RequireOrg } from "components/RequireOrg";

import { ResetClipSyncTime } from "components/ResetClipSyncTime";
import { RoleContextProvider } from "components/auth/RoleContextProvider";
import { NotificationWrapper } from "components/layout/NotificationWrapper";
import { AdminUserRequired, LimitedUserRequired } from "components/layout/RoleGuards";
import { useOnMount } from "hooks/lifetime";
import { Settings } from "luxon";
import AnalyticsSearchPage from "pages/AnalyticsPage";
import { ArchivePage } from "pages/archive";
import { AssistantPage } from "pages/AssistantPage";
import { CallbackPage } from "pages/CallbackPage";
import { DevicesPageDesktop } from "pages/DevicesPageDesktop";
import { DevicesPageMobile } from "pages/Mobile/DevicesPageMobile";
import { ErrorPage } from "pages/ErrorPage";
import { ForbiddenPage } from "pages/ForbiddenPage";
import { JourneyPage } from "pages/JourneyPage";
import { LoginPage } from "pages/LoginPage";
import { MobileTimelinePage } from "pages/MobileTimelinePage";
import { PersonalWallPage } from "pages/PersonalWallPage";
import { SettingsPage, TABS } from "pages/SettingsPage";
import { TimelinePage } from "pages/TimelinePage";
import { PublicVideoPage } from "pages/PublicVideoPage";
import { WallPage } from "pages/WallPage";
import { useSentryTrackTenant } from "utils/sentry";
import { SettingsPageMobile } from "pages/Mobile/SettingsPageMobile";
import { MembersPageMobile } from "pages/Mobile/MembersPageMobile";
import { ProfilePageMobile } from "pages/Mobile/ProfilePageMobile";
import { ControlsPageMobile } from "pages/Mobile/ControlsPageMobile";
import { NotificationsPageMobile } from "components/settings/mobile/NotificationsPageMobile";
import { PersonalWallPageMobile } from "pages/Mobile/PersonalWallPageMobile";
import { KioskPage } from "pages/KioskPage";
import { PublicKioskPage } from "pages/PublicKioskPage";
import { QUERY_CLIENT } from "utils/query_client";
import { browserClose } from "utils/native";
import { MobileLoginPage } from "pages/MobileLoginPage";
import { DashboardPage, EditReportPage } from "pages/dashboard";
import { RequireCameraFromQueryID } from "components/timeline/RequireCameraFromQueryID";
import { initializeIntercom } from "./libs/intercom.js";
import { IntercomIntegration } from "./components/intercom";
import { DiscoverPageDesktop } from "pages/DiscoverPageDesktop";
import { DiscoverPageMobile } from "pages/Mobile/DiscoverPageMobile";
import {
  AccessControlIntegrationAuthSuccessCbPage,
  AccessControlPage,
  AccessControlPageTabOption,
} from "./pages/accessControl";
import axios, { AxiosError, type AxiosResponse, CanceledError } from "axios";
import { MountIfFeatureEnabled } from "components/common/OptionalRender";
import { CameraRegistrationPageMobile } from "features/camera_registration/CameraRegistrationPageMobile";
import { PathNames } from "./hooks/usePageNavigation";
import { AdministrationPage } from "./pages/administration";

const ReactQueryDevtoolsProduction = React.lazy(() =>
  import("react-query/devtools/development").then((d) => ({
    default: d.ReactQueryDevtools,
  })),
);

// Send all axios errors to sentry
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Do not report canceled errors to sentry
    if (!(error instanceof CanceledError)) {
      Sentry.captureException(error);
    }
    return Promise.reject(error);
  },
);

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_APP_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT_NAME,
  release: import.meta.env.VITE_VERSION,
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        "api.coram.ai",
        "app-api-staging.tailf8916.ts.net",
        "app-api-release.tailf8916.ts.net",
        /^\//,
      ],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      ),
    }),
    new Sentry.Replay({
      maskAllInputs: false,
      maskAllText: false,
      networkDetailAllowUrls: [window.location.origin, "https://api.coram.ai/"],
    }),
  ],
  autoSessionTracking: true,
  tracesSampleRate: 1.0,
  attachStacktrace: true,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  debug: ["staging", "dev"].includes(import.meta.env.VITE_ENVIRONMENT_NAME),
});

// Sentry router instrumentation
const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

// Intercom Chat Bot
initializeIntercom();

// Configure luxon
Settings.defaultLocale = "en-US";

if (import.meta.env.VITE_DOMAIN) {
  OpenAPI.BASE = `${import.meta.env.VITE_DOMAIN}:${
    import.meta.env.VITE_BACKEND_PORT
  }`;
}

function RootRoutes() {
  const { user, handleRedirectCallback } = useAuth0();

  const navigate = useNavigate();

  useSentryTrackTenant();

  // report sentry user
  useEffect(() => {
    if (user != null) {
      Sentry.setUser({
        username: user.name,
        email: user.email,
      });
    }
  }, [user]);

  useOnMount(() => {
    CapApp.addListener("appUrlOpen", async ({ url }) => {
      if (url.startsWith(import.meta.env.VITE_AUTH0_CALLBACK_URL_NATIVE)) {
        if (
          url.includes("state") &&
          (url.includes("code") || url.includes("error"))
        ) {
          // login workflow
          try {
            const res = await handleRedirectCallback(url);
            navigate(res.appState.returnTo);
          } catch (e) {
            console.error(
              "error on redirect callback. This might be caused by Strict Mode",
              e,
            );
          }
        } else {
          // logout workflow, just redirect to login
          navigate("/login");
        }
        // this will be run for all redirects
        await browserClose();
      }
    });
  });

  return (
    <SentryRoutes>
      <Route
        path="/login"
        element={
          <>
            <DesktopOnly>
              <LoginPage />
            </DesktopOnly>
            <MobileOnly>
              <MobileLoginPage />
            </MobileOnly>
          </>
        }
      />
      <Route path="/" element={<Navigate to="/live" />} />
      <Route
        path="/live"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <ResetClipSyncTime>
                  <WallPage />
                </ResetClipSyncTime>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/wall"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <DesktopOnly>
                  <PersonalWallPage />
                </DesktopOnly>
                <MobileOnly>
                  <PersonalWallPageMobile />
                </MobileOnly>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/discover"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    <DesktopOnly>
                      <DiscoverPageDesktop />
                    </DesktopOnly>
                    <MobileOnly>
                      <DiscoverPageMobile />
                    </MobileOnly>
                  </ResetClipSyncTime>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/register-cameras"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <ResetClipSyncTime>
                  <MobileOnly>
                    <MobileInnerPageLayout title={"Add New Cameras"}>
                      <CameraRegistrationPageMobile />
                    </MobileInnerPageLayout>
                  </MobileOnly>
                </ResetClipSyncTime>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/assistant"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    <MountIfFeatureEnabled
                      feature={FeatureFlags.ASSISTANT_ENABLED}
                    >
                      <AssistantPage />
                    </MountIfFeatureEnabled>
                  </ResetClipSyncTime>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/archive"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingY>
                  <ResetClipSyncTime>
                    <ArchivePage />
                  </ResetClipSyncTime>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    {<AnalyticsSearchPage />}
                  </ResetClipSyncTime>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/kiosk"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <KioskPage />
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/integrations/auth/success-cb"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.ACCESS_CONTROL_ENABLED}
                  >
                    <AccessControlIntegrationAuthSuccessCbPage />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/integrations"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.ACCESS_CONTROL_ENABLED}
                  >
                    <AccessControlPage
                      tab={AccessControlPageTabOption.Events}
                    />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/integrations/sensors"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.ACCESS_CONTROL_ENABLED}
                  >
                    <AccessControlPage
                      tab={AccessControlPageTabOption.IntegratedSensors}
                    />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/integrations/settings"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.ACCESS_CONTROL_ENABLED}
                  >
                    <AccessControlPage
                      tab={AccessControlPageTabOption.Integrations}
                    />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="timeline/:cameraId/:timestamp?"
        element={
          <RequireAuth>
            <RequireOrg>
              <DesktopOnly>
                <AppLayout noExtraPaddingY noExtraPaddingX>
                  <RequireCameraFromQueryID component={TimelinePage} />
                </AppLayout>
              </DesktopOnly>
              <MobileOnly>
                <AppLayout noExtraPaddingY noExtraPaddingX notchGuard>
                  <RequireCameraFromQueryID component={MobileTimelinePage} />
                </AppLayout>
              </MobileOnly>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/timeline/journey"
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <JourneyPage />
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="devices"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <ResetClipSyncTime>
                  <DesktopOnly>
                    <DevicesPageDesktop />
                  </DesktopOnly>
                  <MobileOnly>
                    <DevicesPageMobile />
                  </MobileOnly>
                </ResetClipSyncTime>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="settings"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <ResetClipSyncTime>
                  <DesktopOnly>
                    <SettingsPage />
                  </DesktopOnly>
                  <MobileOnly>
                    <SettingsPageMobile />
                  </MobileOnly>
                </ResetClipSyncTime>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/members"
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    <MobileOnly>
                      <MobileInnerPageLayout title={TABS.MEMBERS}>
                        <MembersPageMobile />
                      </MobileInnerPageLayout>
                    </MobileOnly>
                  </ResetClipSyncTime>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <RequireOrg>
              <AppLayout noExtraPaddingX noExtraPaddingY>
                <ResetClipSyncTime>
                  <MobileOnly>
                    <MobileInnerPageLayout title={TABS.PROFILE}>
                      <ProfilePageMobile />
                    </MobileInnerPageLayout>
                  </MobileOnly>
                </ResetClipSyncTime>
              </AppLayout>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    <MobileOnly>
                      <MobileInnerPageLayout title={TABS.NOTIFICATION}>
                        <NotificationsPageMobile />
                      </MobileInnerPageLayout>
                    </MobileOnly>
                  </ResetClipSyncTime>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="/controls"
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <ResetClipSyncTime>
                    <MobileOnly>
                      <MobileInnerPageLayout title={TABS.CONTROLS}>
                        <ControlsPageMobile />
                      </MobileInnerPageLayout>
                    </MobileOnly>
                  </ResetClipSyncTime>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path="video/:uniqueHash"
        element={
          <SimpleAppLayout>
            <ResetClipSyncTime>
              <PublicVideoPage isLive={false} />
            </ResetClipSyncTime>
          </SimpleAppLayout>
        }
      />
      <Route
        path="live/:uniqueHash"
        element={
          <SimpleAppLayout>
            <ResetClipSyncTime>
              <PublicVideoPage isLive={true} />
            </ResetClipSyncTime>
          </SimpleAppLayout>
        }
      />
      <Route
        path="k/:kioskHash"
        element={
          <SimpleAppLayout showLogo={false}>
            <ResetClipSyncTime>
              <PublicKioskPage />
            </ResetClipSyncTime>
          </SimpleAppLayout>
        }
      />
      <Route
        path={`${PathNames.INSIGHTS}/:dashboardId?`}
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.DASHBOARD_PAGE_ENABLED}
                  >
                    <DashboardPage />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path={`${PathNames.INSIGHTS}/:dashboardId/report/:reportId`}
        element={
          <RequireAuth>
            <RequireOrg>
              <LimitedUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.DASHBOARD_PAGE_ENABLED}
                  >
                    <EditReportPage />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </LimitedUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path={PathNames.ADMINISTRATION}
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED}
                  >
                    <AdministrationPage tab="organisations" />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path={`${PathNames.ADMINISTRATION}/cvrs`}
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED}
                  >
                    <AdministrationPage tab="nvrs" />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route
        path={`${PathNames.ADMINISTRATION}/cameras`}
        element={
          <RequireAuth>
            <RequireOrg>
              <AdminUserRequired>
                <AppLayout noExtraPaddingX noExtraPaddingY>
                  <MountIfFeatureEnabled
                    feature={FeatureFlags.GLOBAL_ADMINISTRATION_ENABLED}
                  >
                    <AdministrationPage tab="cameras" />
                  </MountIfFeatureEnabled>
                </AppLayout>
              </AdminUserRequired>
            </RequireOrg>
          </RequireAuth>
        }
      />
      <Route path="callback" element={<CallbackPage />} />
      <Route path="403" element={<ForbiddenPage />} />
      <Route path="*" element={<ErrorPage />} />
    </SentryRoutes>
  );
}

function App() {
  const [showProdDevtools, setShowProdDevtools] = React.useState(false);

  React.useEffect(() => {
    // NOTE(@lberg): this allows to trigger the devtools from the console.
    // From https://github.com/TanStack/query/discussions/3296
    const windowAny = window as unknown as { toggleDevtools: () => void };
    windowAny.toggleDevtools = () => setShowProdDevtools((old) => !old);
  }, []);

  // Move to hook, this is to avoid content on the notch on mobile.
  useEffect(() => {
    document.body.style.padding =
      "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)";
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Auth0ProviderWithNavigate />}>
        <Route element={<RoleContextProvider />}>
          <Route element={<IntercomIntegration />}>
            <Route element={<NotificationWrapper />}>
              <Route path="*" element={<RootRoutes />} />
            </Route>
          </Route>
        </Route>
      </Route>,
    ),
  );

  return (
    <RecoilRoot>
      <QueryClientProvider client={QUERY_CLIENT}>
        <LocalizationProvider dateAdapter={AdapterLuxon}>
          <SettingsProvider>
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
                    <NativeOnly>
                      <NoSleep />
                    </NativeOnly>
                    <RouterProvider router={router} />
                  </RTL>
                </ThemeProvider>
              )}
            </SettingsConsumer>
          </SettingsProvider>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
          {showProdDevtools && (
            <React.Suspense fallback={null}>
              <ReactQueryDevtoolsProduction
                initialIsOpen={false}
                position="bottom-right"
              />
            </React.Suspense>
          )}
        </LocalizationProvider>
      </QueryClientProvider>
    </RecoilRoot>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
