import axios from "axios";
import { ApiTypes } from "../types/api-types";
import {
  AUTH_TOKEN, clickupTypes,
  ERROR_RATE_LIMIT_EXCEED,
  MAINTENANCE,
  routes,
  USER_OBJECT,
} from "../constants";
import { Client, LeadFormData, ROLE, SOURCE, UpdatePaymentMethod } from "../../services/types/common";
import {
  CustomerObject,
  DateProps,
  ProfileObject,
  ProfileSource,
  SubscriptionObject,
  UserStatus,
  UsersObject,
} from "../types/common";
import { SelectedFields } from "../types/common";
import moment from "moment";
import { BidDetails } from "../types/bids";
import { handleAuthLogout } from "../hooks/handleLogout";
import { customNotification } from "../../components";
import { IOnboardingStepType } from "../types/onboarding-steps";
import { UserState } from "../types/user";

axios.defaults.baseURL = process.env.REACT_APP_BASE_URL;

axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem(AUTH_TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const user: UserState = JSON.parse(localStorage.getItem(USER_OBJECT) || '{}');
    if (error.response?.status === 440) {
      handleAuthLogout(
        "You'll be logged out of your current session as it has expired."
      );
      return Promise.reject(error);
    } else if (error.response?.status === 402) {
      if (user.role === ROLE.OWNER) {
        localStorage.setItem(USER_OBJECT, JSON.stringify({ ...user, company: { ...user.company, subscription: { isActive: false } } }))
        window.location.href = routes.billing;
      } else {
        handleAuthLogout(
          "You'll be logged out of your current session as the subscription has expired.",
          true
        );
        return Promise.reject(error);
      }
    }
    else if (error.response?.status === 429) {
      customNotification.error(ERROR_RATE_LIMIT_EXCEED);
    } else if (
      error.response?.status === 503 &&
      error.response?.data?.message === MAINTENANCE
    ) {
      window.location.href = routes.maintenance;
      return;
    }
    return Promise.reject(error);
  }
);

export const apis = {
  authenticate: ({ idToken }: ApiTypes.Authenticate) =>
    axios.post("auth/authenticate", { idToken }),
  authenticateSignInForExtension: ({ idToken }: ApiTypes.Authenticate) =>
    axios.post("auth/authenticate/sign-in", { idToken }),
  getAllThemes: () => axios.get("/themes"),
  getAllCategories: () => axios.get("/categories"),
  addUserProfile: ({
    location,
    colorThemeId,
    categories,
  }: ApiTypes.AddUserProfile) =>
    axios.post("user/add-user-profile", { location, colorThemeId, categories }),
  createCompany: ({
    websiteUrl,
    logoUrl,
    companySize,
    name,
    phoneNumber,
  }: ApiTypes.CreateCompany) => {
    const requestBody: ApiTypes.CreateCompany = { companySize, name };
    if (websiteUrl) {
      requestBody.websiteUrl = websiteUrl;
    }
    if (logoUrl) {
      requestBody.logoUrl = logoUrl;
    }
    if (phoneNumber) {
      requestBody.phoneNumber = phoneNumber;
    }

    return axios.post("workspaces", requestBody);
  },
  addTeamMember: (members: Array<ApiTypes.AddTeamMembers>) =>
    axios.post("invitation", { members }),
  acceptInvite: (id: string) => axios.post(`invitation/accept-invite/${id}`),
  deleteInvite: (id: string) => axios.delete(`invitation/delete/${id}`),
  sendForgotPasswordEmail: ({ userId }: { userId: string }) =>
    axios.post(`/invitation/forgot-password`, { userId }),
  getAllTags: (search: string, page = 1) =>
    axios.get(`/tags?search=${search}&page=${page}`),
  createPortfolio: (portfolio: ApiTypes.Portfolio) =>
    axios.post("portfolios", portfolio),
  bulkCreatePortfolios: (portfolios: ApiTypes.Portfolio[]) =>
    axios.post("/portfolios/bulk-import", portfolios),
  updatePortfolio: (portfolio: ApiTypes.Portfolio) =>
    axios.put("portfolios", portfolio),
  getAllPortfolios: (
    type: string = "",
    search: string = "",
    page: number = 1,
    perPage: number = 20,
    sort = "createdAt",
    tags: string
  ) =>
    axios.get(
      `/portfolios?type=${type}&page=${page}&search=${search}&perPage=${perPage}&sort=${sort}&tags=${tags}`
    ),
  deletePortfolio: (id: string) => axios.delete(`/portfolios/${id}`),

  getClickupIntegration: () => axios.get(`/integrations/clickup`),
  getClickupSharedHierarchy: (workspaceId: string) =>
    axios.get(`/integrations/clickup/workspaces/${workspaceId}/shared`),
  getClickupWorkspaces: (code: string) =>
    axios.get(`/integrations/clickup/${code}`),
  getClickupSpaces: (workspaceId: string) =>
    axios.get(`/integrations/clickup/spaces/${workspaceId}`),
  getClickupFolders: (spaceId: string) =>
    axios.get(`/integrations/clickup/spaces/${spaceId}/folders`),
  getClickupFolderlessLists: (spaceId: string) =>
    axios.get(`/integrations/clickup/spaces/${spaceId}/foldersless`),
  getClickupFields: (listId: string) =>
    axios.get(`/integrations/clickup/list/${listId}/fields`),
  saveClickupConfigurations: (selectedData: any) =>
    axios.post(`/integrations/clickup/integrate`, selectedData),
  saveClickupFieldsMapping: ({
    customFields,
    subType,
  }: {
    customFields: SelectedFields[];
    subType: clickupTypes;
  }) => axios.post(`/integrations/clickup/fields`, { customFields, subType }),
  saveUpworkClickupProfile: ({
    profiles,
  }: {
    profiles: any[];
  }) => axios.post(`/integrations/clickup/fields/upwork-profiles`, { profiles }),
  saveClickupProfileInfo: (code: string) =>
    axios.post(`/integrations/clickup/profile`, { code }),
  getClickupProfileInfo: () => axios.get(`/integrations/clickup/profile`),
  deleteClickupIntegration: () =>
    axios.delete(`/integrations/clickup/integration`),

  getHubspotProperties: () => axios.get(`/integrations/hubspot/properties`),
  getHubspotPipelines: (code: string) =>
    axios.get(`/integrations/hubspot/${code}`),
  saveHubspotConfigurations: (selectedData: any) =>
    axios.post(`/integrations/hubspot/integrate`, selectedData),
  getHubspotIntegration: () => axios.get(`/integrations/hubspot`),
  deleteHubspotIntegration: () =>
    axios.delete(`/integrations/hubspot/integration`),

  updateName: ({ name }: { name: string }) =>
    axios.post(`/user/update-name`, { name }),

  getBiddersBidOrAdminBids: ({
    search,
    type,
    profile,
    page,
    bidder,
    slug,
    status,
    perPage,
    skillset,
    clientBudgetMin,
    clientBudgetMax,
    proposedRate,
    receivedRate,
    leadStartDate,
    leadEndDate,
    proposalStartDate,
    proposalEndDate,
    contractStartDate,
    contractEndDate,
    location,
    dates,
  }: {
    search?: string;
    profile?: string;
    status?: string;
    page?: number;
    bidder?: string;
    slug?: string;
    type?: string;
    dates?: DateProps;
    perPage?: number;
    skillset?: string[];
    clientBudgetMin?: number;
    clientBudgetMax?: number;
    proposedRate?: number;
    receivedRate?: number;
    location?: string;
    leadStartDate?: Date,
    leadEndDate?: Date,
    proposalStartDate?: Date,
    proposalEndDate?: Date,
    contractStartDate?: Date,
    contractEndDate?: Date,

  }) => {
    const queryParams = {
      ...(search && { search }),
      ...(profile && { profile }),
      ...(status && { status }),
      ...(type && { type }),
      ...(page && { page }),
      ...(bidder && { bidder }),
      ...(slug && { slug }),
      ...(dates?.startDate && {
        startDate: moment(dates.startDate).startOf("day").toISOString(),
      }),
      ...(dates?.endDate && {
        endDate: moment(dates.endDate).endOf("day").toISOString(),
      }),
      ...(perPage && { perPage }),
      ...(skillset && { skillset: skillset.join(",") }),
      ...(clientBudgetMin && { clientBudgetMin }),
      ...(clientBudgetMax && { clientBudgetMax }),
      ...(proposedRate && { proposedRate }),
      ...(receivedRate && { receivedRate }),
      ...(location && { location }),
      ...(leadStartDate && {
        leadStartDate: moment(leadStartDate).startOf("day").toISOString(),
      }),
      ...(leadEndDate && {
        leadEndDate: moment(leadEndDate).endOf("day").toISOString(),
      }),
      ...(proposalStartDate && {
        proposalStartDate: moment(proposalStartDate).startOf("day").toISOString(),
      }),
      ...(proposalEndDate && {
        proposalEndDate: moment(proposalEndDate).endOf("day").toISOString(),
      }),
      ...(contractStartDate && {
        contractStartDate: moment(contractStartDate).startOf("day").toISOString(),
      }),
      ...(contractEndDate && {
        contractEndDate: moment(contractEndDate).endOf("day").toISOString(),
      }),
    };

    return axios.get("/bids/all", { params: queryParams });
  },

  getCompany: (id: string) => axios.get(`/workspaces/${id}`),
  deleteWorkspace: (otp: string) =>
    axios.post("workspaces/workspace-deletion", { otp }),
  getWorkspaceDeletionInfo: () => axios.get("workspaces/workspace-deletion"),
  stopWorkspaceDeletion: () => axios.delete("workspaces/workspace-deletion"),
  workpsaceDeletionOtp: () => axios.post("workspaces/send-otp"),
  getCompanyUsers: (page: number = 1, perPage: number = 20) =>
    axios.get(`/user/company-users?page=${page}&perPage=${perPage}`),
  getPendingInvites: (page: number = 1) =>
    axios.get(`/user/company-invites?page=${page}`),
  getAllCompanyUsersCount: () => axios.get("/user/count/company-users"),
  getAllCompanyUsers: () => axios.get("/user/all/company-users"),
  getCompanyProfiles: (page: number, perPage: number = 20) =>
    axios.get(`/profiles/company?&page=${page}&perPage=${perPage}`),
  updateUser: (user: UsersObject) => axios.put("/user/update", user),
  updateUserStatus: (id: string, userStatus: UserStatus) =>
    axios.post(`/user/update-status/${id}`, userStatus),
  countBiddersBids: (dates?: DateProps | undefined, bidderId?: string) => {
    const queryParams = {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(bidderId && { bidderId }),
      ...(dates &&
        dates.startDate && {
        startDate: moment(dates.startDate).startOf("date").toISOString(),
      }),
      ...(dates &&
        dates.endDate && {
        endDate: moment(dates.endDate).endOf("date").toISOString(),
      }),
    };

    return axios.get("/bidder/bids/count", { params: queryParams });
  },
  getLinkedinStats: (dates?: DateProps | undefined, bidderId?: string) => {
    const queryParams = {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(bidderId && { bidderId }),
      ...(dates &&
        dates.startDate && {
        startDate: moment(dates.startDate).startOf("date").toISOString(),
      }),
      ...(dates &&
        dates.endDate && {
        endDate: moment(dates.endDate).endOf("date").toISOString(),
      }),
    };
    return axios.get("linkedin-accounts/dashboard/count", {
      params: queryParams,
    });
  },
  getLinkedinIndustries: () => axios.get(`/industries`),
  getLinkedinIndustriesWithPagination: ({
    page,
    perPage,
    search,
  }: {
    page: number;
    perPage: number;
    search?: string;
  }) => {
    const queryParams = {
      page,
      perPage,
      ...(search && { search }),
    };
    return axios.get(`/industries/all`, { params: queryParams });
  },
  getAllCompanyUpworkProfiles: (source: ProfileSource) =>
    axios.get(`/profiles?source=${source}`),

  getSkillsTags: (search = "", page = 1, tags = "") =>
    axios.get(`/tags?search=${search}&page=${page}&tags=${tags}`),


  getAllContacts: ({
    search,
    source,
    linkedInType,
    upworkProfile,
    linkedinProfile,
    bidder,
    industries,
    page,
    dates,
    perPage,
  }: {
    search?: string;
    source?: string;
    linkedInType?: string;
    upworkProfile?: string;
    linkedinProfile?: string;
    bidder?: string;
    industries?: string;
    page?: number;
    dates?: DateProps | undefined;
    perPage?: number;
  }) => {
    if (!!upworkProfile && !linkedinProfile && source !== SOURCE.LINKEDIN)
      source = SOURCE.UPWORK;
    if (!!linkedinProfile && !upworkProfile && source !== SOURCE.UPWORK)
      source = SOURCE.LINKEDIN;
    if (!!industries && !upworkProfile && source !== SOURCE.UPWORK)
      source = SOURCE.LINKEDIN;

    const queryParams = {
      ...(search && { search }),
      ...(source && { source }),
      ...(linkedInType && { linkedInType: linkedInType }),
      ...(upworkProfile && { upworkProfile }),
      ...(linkedinProfile && { linkedinProfile }),
      ...(bidder && { bidder }),
      ...(industries && { industries }),
      ...(page && { page }),
      ...(dates &&
        dates.startDate && {
        startDate: moment(dates.startDate).startOf("date").toISOString(),
      }),
      ...(dates &&
        dates.endDate && {
        endDate: moment(dates.endDate).endOf("date").toISOString(),
      }),
      ...(perPage && { perPage }),
    };
    return axios.get("/contacts", { params: queryParams });
  },

  getExcelContacts: ({
    search,
    source,
    linkedInType,
    upworkProfile,
    linkedinProfile,
    bidder,
    industries,
    dates,
  }: {
    search?: string;
    source?: string;
    linkedInType?: string;
    upworkProfile?: string;
    linkedinProfile?: string;
    bidder?: string;
    industries?: string;
    page?: number;
    dates?: DateProps | undefined;
    perPage?: number;
  }) => {
    if (!!upworkProfile && !linkedinProfile && source !== SOURCE.LINKEDIN)
      source = SOURCE.UPWORK;
    if (!!linkedinProfile && !upworkProfile && source !== SOURCE.UPWORK)
      source = SOURCE.LINKEDIN;
    if (!!industries && !upworkProfile && source !== SOURCE.UPWORK)
      source = SOURCE.LINKEDIN;

    const queryParams = {
      ...(search && { search }),
      ...(source && { source }),
      ...(linkedInType && { linkedInType: linkedInType }),
      ...(upworkProfile && { upworkProfile }),
      ...(linkedinProfile && { linkedinProfile }),
      ...(bidder && { bidder }),
      ...(industries && { industries }),
      ...(dates &&
        dates.startDate && {
        startDate: moment(dates.startDate).startOf("date").toISOString(),
      }),
      ...(dates &&
        dates.endDate && {
        endDate: moment(dates.endDate).endOf("date").toISOString(),
      }),
    };
    return axios.get("/contacts/excel", { params: queryParams });
  },
  getContactBySlug: (slug: string) => axios.get(`/contacts/${slug}`),

  getAllCompanies: ({
    search,
    companySize,
    page,
    perPage,
  }: {
    search?: string;
    companySize?: string;
    page?: number;
    perPage?: number;
  }) => {
    const queryParams = {
      ...(search && { search }),
      ...(companySize && { companySize }),
      ...(page && { page }),
      ...(perPage && { perPage }),
    };
    return axios.get("/companies", { params: queryParams });
  },

  getCompanyBySlug: (slug: string) => axios.get(`/companies/${slug}`),

  createManualLead: (leadData: LeadFormData) =>
    axios.post("/accounts/manual", {
      ...leadData,
      connects: Math.abs(+leadData?.connects || 0).toString(),
    }),

  deleteUser: (userId: string) => axios.delete(`/user/delete/${userId}`),
  deleteProfile: (profileId: string) => axios.delete(`/profiles/${profileId}`),
  countGoalStats: (type: SOURCE = SOURCE.UPWORK) =>
    axios.get(`/user/goal/count`, {
      params: {
        type,
        monthStart: moment().startOf("month").toDate(),
        dayStart: moment().startOf("day").toDate(),
        dayEnd: moment().endOf("day").toDate(),
      },
    }),
  getClientDetails: (id: string) => axios.get(`/accounts/client/${id}`),
  updateClientDetails: (id: string, clientData: Client) =>
    axios.put(`/accounts/client/update/${id}`, clientData),
  createProfile: (profileObject: ProfileObject) =>
    axios.post("/profiles", profileObject),
  updateProfile: (profileObject: ProfileObject) =>
    axios.put("/profiles", profileObject),

  createTags: (tags: string[]) => axios.post("/tags/create", tags),

  updateBidDetails: (id: string, updateBid: BidDetails) =>
    axios.put(`/bids/${id}`, updateBid),

  createCustomer: (customerObj: CustomerObject) =>
    axios.post("/stripe/customers", customerObj),

  updatePaymentMethod: (data: UpdatePaymentMethod) =>
    axios.put("/stripe/payment-method", data),

  createSubscription: (subscriptionObj: SubscriptionObject) =>
    axios.post("/stripe/subscriptions", subscriptionObj),

  revokeUserSession: (userId: string) => axios.delete(`/auth/revoke/${userId}`),

  revokeCompanySession: (companyId: string) =>
    axios.delete(`/auth/revoke-company/${companyId}`),

  getLogs: (bidId?: string, contactId?: string) => {
    const queryParams = {
      ...(bidId && { bidId }),
      ...(contactId && { contactId }),
    };
    return axios.get("/logs", { params: queryParams });
  },
  getHubId: () => axios.get("integrations/hubspot/hub_id"),

  resyncBid: (id: string, type: string) =>
    axios.put(`/bids/resync/${id}`, { type }),

  getGlobalConfiguration: () =>
    axios.get("configurations/global-configuration"),

  createCompanySettings: (sessionTimeout: number | null) =>
    axios.post("settings/create", { sessionTimeout }),

  createIndustry: (data: any) => axios.post("/industries", data),

  userExists: (email: string) =>
    axios.get("/auth/user-exists", { params: { email } }),

  updateIndustry: ({ id, values }: any) =>
    axios.put(`/industries/${id}`, values),

  createComment: (comment: {
    bidId: string;
    userId: string;
    commentText: string;
  }) => axios.post("/comments", comment),

  getComment: (bidId: string) =>
    axios.get("/comments/bid", { params: { bidId } }),

  updateWorkspace: ({ id, values }: any) =>
    axios.put(`/workspaces/${id}`, values),

  deleteIndustry: (id: string) => axios.delete(`/industries/${id}`),

  getActiveNotifications: () => axios.get("/notifications/active"),

  getMaintainceModeNotification: () => axios.get("/notifications/maintenance"),

  getOnboardingSteps: () => axios.get("/onboarding-center"),
  updateOnboardingStep: async (payload: { key: IOnboardingStepType }) => await axios.put("/onboarding-center", payload),
  onBoardingCompleted: (onBoardingCompleted: boolean) => axios.put("/onboarding-center/onboarding-complete", { onBoardingCompleted }),

  getPaymentPlans: () => axios.get("/payments/plans"),
  getBillingDetails: () => axios.get("/payments/subscription-details"),
  getAllInvoices: () => axios.get("/payments/invoices"),
  getInvoice: (invoiceId: string) => axios.get(`/payments/invoices/${invoiceId}`),
  cancelSubscription: () => axios.post("/stripe/cancel-subscription"),
  reactiveSubscription: () => axios.post("/stripe/reactive-subscription"),

  manualPayForPlan: () => axios.post("/stripe/manual-pay"),
};
