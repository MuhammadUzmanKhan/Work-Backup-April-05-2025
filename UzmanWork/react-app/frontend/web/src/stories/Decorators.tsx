import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import * as Sentry from "@sentry/react";
import { addExtensionMethods } from "@sentry/tracing";
import { StoryFn } from "@storybook/react";
import {
  OrgCamerasAudioSettings,
  Organization,
  selectedOrganization,
  OrganizationContext,
  OrgCamerasWebRTCSettings,
} from "coram-common-utils";
import { RoleContext } from "components/auth/RoleContextProvider";
import { NotificationWrapper } from "components/layout/NotificationWrapper";
import { SettingsProvider } from "contexts/settings-context";
import {
  TriageDragStatus,
  DEFAULT_TRIAGE_DRAG_STATUS,
  TriageDragContext,
} from "contexts/triage_drag_context";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import { RecoilRoot, useSetRecoilState } from "recoil";

export function RecoilDecorator(StoryComponent: StoryFn) {
  return (
    <RecoilRoot>
      <StoryComponent />
    </RecoilRoot>
  );
}

export function RouterDecorator(StoryComponent: StoryFn) {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<NotificationWrapper />}>
        <Route path="*" element={<StoryComponent />} />
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

const queryClient = new QueryClient();

export function QueryClientDecorator(StoryComponent: StoryFn) {
  return (
    <QueryClientProvider client={queryClient}>
      <StoryComponent />
    </QueryClientProvider>
  );
}

export function DefaultOrganizationDecorator(StoryComponent: StoryFn) {
  const setOrganization = useSetRecoilState(selectedOrganization);
  const defaultOrg: Organization = {
    tenant: "Default",
    name: "Default",
    id: 0,
    retention_hours_always_on_streams: 168,
    low_res_bitrate_kbps: 512,
    inactive_user_logout_enabled: false,
    cameras_audio_settings: OrgCamerasAudioSettings.ENABLED,
    cameras_webrtc_settings: OrgCamerasWebRTCSettings.MANUAL,
  };
  setOrganization(defaultOrg);
  return <StoryComponent />;
}

export function DefaultOrganizationProviderDecorator(StoryComponent: StoryFn) {
  const organization = {
    organization: {
      tenant: "Default",
      name: "Default",
      id: 0,
      retention_hours_always_on_streams: 168,
      low_res_bitrate_kbps: 512,
      inactive_user_logout_enabled: false,
      cameras_audio_settings: OrgCamerasAudioSettings.ENABLED,
      cameras_webrtc_settings: OrgCamerasWebRTCSettings.MANUAL,
    },
    refetchOrganizations: () => null,
  };
  return (
    <OrganizationContext.Provider value={organization}>
      <StoryComponent />
    </OrganizationContext.Provider>
  );
}

export function LocalizationProviderDecorator(StoryComponent: StoryFn) {
  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <StoryComponent />
    </LocalizationProvider>
  );
}

export function SentryDecorator(StoryComponent: StoryFn) {
  useEffect(() => {
    Sentry.init({});
    addExtensionMethods();
  }, []);
  return <StoryComponent />;
}

export function RoleContextProviderDecorator(
  StoryComponent: StoryFn,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  return (
    <RoleContext.Provider value={context?.globals?.role}>
      <StoryComponent />
    </RoleContext.Provider>
  );
}

export function TriageDragProviderDecorator(StoryComponent: StoryFn) {
  const [triageDragStatus, setTriageDragStatus] = useState<TriageDragStatus>(
    DEFAULT_TRIAGE_DRAG_STATUS
  );
  return (
    <TriageDragContext.Provider
      value={{ triageDragStatus, setTriageDragStatus }}
    >
      <StoryComponent />
    </TriageDragContext.Provider>
  );
}

export function SettingsContextDecorator(StoryComponent: StoryFn) {
  return (
    <SettingsProvider>
      <StoryComponent />
    </SettingsProvider>
  );
}
