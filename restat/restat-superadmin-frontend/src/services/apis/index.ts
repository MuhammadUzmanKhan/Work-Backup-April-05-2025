import axios from "axios";
import { ApiTypes } from "../types/api-types";
import { AUTH_TOKEN } from "../constants";
import { GlobalConfigurationPayload } from "../types/common";

axios.defaults.baseURL = import.meta.env.VITE_APP_BASE_URL;
axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem(AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apis = {
  authenticate: ({ idToken }: ApiTypes.Authenticate) => axios.post("super-admin/auth/authenticate", { idToken }),
  verifyOtp: ({ otp, idToken }: ApiTypes.VerifyOtp) => axios.post("super-admin/auth/verify-otp", { otp, idToken }),
  getGlobalConfiguration: () => axios.get("configurations/global-configuration"),
  getAllWorkspaces: ({
    search,
    page,
    perPage,
    dateFilterType,
    startDate,
    endDate,
  }: {
    search?: string;
    page?: number;
    perPage?: number;
    dateFilterType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = {
      ...(search && { search }),
      ...(page && { page }),
      ...(perPage && { perPage }),
      ...(dateFilterType && { dateFilterType }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };
    return axios.get("/workspaces", { params: queryParams });
  },
  updateConfiguration: ({ id, ...data }: GlobalConfigurationPayload) => axios.put(`configurations/${id}`, { ...data }),
  getAllNotifications: () => axios.get("/notifications"),
  toggleMaintenanceMode: (isMaintenanceMode: boolean) => axios.post("/notifications/toggle-maintenance", { isMaintenanceMode }),
  getMaintainceModeNotification: () => axios.get("/notifications/maintenance"),
  createNotification: (data: ApiTypes.Notification) => axios.post("/notifications", data),
  updateNotification: (id: string, data: ApiTypes.Notification) => axios.put(`/notifications?id=${id}`, data),
  deleteNotification: (id: string) => axios.delete(`/notifications?id=${id}`),
  allextensionRelases: () => axios.get("/extension-releases"),
  createExtensionRelease: (data: ApiTypes.ExtensionRelease) => axios.post("/extension-releases", data),
  toggelActiveExtensionRelease: ({ id, isActive, }: { id: string; isActive: boolean; }) => axios.put(`/extension-releases/${id}`, { isActive }),
  deleteExtensionRelease: (id: string) => axios.delete(`/extension-releases/${id}`),
};
