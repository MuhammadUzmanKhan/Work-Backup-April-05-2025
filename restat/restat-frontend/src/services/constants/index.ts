import moment from "moment";
import { CustomField } from "../types/common";

export const defaultDates = {
  defaultStartDate: moment().startOf('month').toDate(),
  defaultEndDate: new Date(),
}

export enum clickupTypes {
  DEALS = 'DEALS',
  CONTACTS = 'CONTACTS',
}

export const LeadLogType = [
  { label: 'FIELD_UPDATED', value: 'FIELD_UPDATED' },
  { label: 'BID_CREATED', value: 'BID_CREATED' },
  { label: 'BID_UPDATED', value: 'BID_UPDATED' },
  { label: 'CLICKUP_TASK_CREATED', value: 'CLICKUP_TASK_CREATED' },
  { label: 'HUBSPOT_DEAL_CREATED', value: 'HUBSPOT_DEAL_CREATED' },
  { label: 'LEAD_SYNCED', value: 'LEAD_SYNCED' },
  { label: 'LEAD_UPDATED', value: 'LEAD_UPDATED' },
  { label: 'JOB_CREATED', value: 'JOB_CREATED' },
  { label: 'JOB_UPDATED', value: 'JOB_UPDATED' },
];

export const AccountLogType = [
  { label: 'CONTACT_CREATED', value: 'CONTACT_CREATED' },
  { label: 'CONTACT_UPDATED', value: 'CONTACT_UPDATED' },
  { label: 'CONTACT_DELETED', value: 'CONTACT_DELETED' },
];

export enum DEAL_LOG_TYPE {
  BID_CREATED = 'BID_CREATED',
  BID_UPDATED = 'BID_UPDATED',
  LEAD_SYNCED = 'LEAD_SYNCED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  JOB_CREATED = 'JOB_CREATED',
  JOB_UPDATED = 'JOB_UPDATED',
  CLICKUP_TASK_CREATED = 'CLICKUP_TASK_CREATED',
  HUBSPOT_DEAL_CREATED = 'HUBSPOT_DEAL_CREATED',
  FIELD_UPDATED = 'FIELD_UPDATED',

}

export enum ACCOUNT_LOG_TYPE {
  ACCOUNT_CREATED = 'CONTACT_CREATED',
  ACCOUNT_UPDATED = 'CONTACT_UPDATED',
  ACCOUNT_DELETED = 'CONTACT_DELETED',
}

export const routes = {
  signUp: "/sign-up",
  signIn: "/sign-in",
  extensionSignIn: "/extension/sign-in",
  profile: "/profile",
  terms: '/terms',
  privacy: '/privacy',
  forgotPassword: '/forgot-password',
  changePassword: '/change-password',
  onBoarding: '/on-boarding',
  invite: '/invite',
  acceptInvite: 'accept-invite/:id/:action',
  portfolios: '/portfolios',
  dashboard: '/',
  settings: '/settings',
  integrationsClickup: '/settings/integrations/clickup',
  integrationsHubspot: '/settings/integrations/hubspot',
  connectToClickupProfile: '/settings/integrations/clickup/profile',
  integrationsUpwork: '/settings/integrations/upwork',
  bids: '/proposals',
  deals: '/deals',
  dealModal: '/deals/:dealId',
  contacts: '/contacts',
  teamMembers: '/team-members',
  jobs: '/contracts',
  leads: '/leads',
  upworkProfiles: '/profiles',
  paymentDetails: "/stripe/payment-details",
  contactModal: '/contacts/:contactSlug',
  contactUs: '/contact-us',
  businessData: '/business-data',
  companies: '/companies',
  companiesModal: '/companies/:companySlug',
  maintenance: '/maintenance',
  onBoardingCenter: '/onboarding-center',
  billing: '/billing'
};

export const routeTitles: Record<string, string> = {
  '/sign-up': 'Sign Up',
  '/sign-in': 'Sign In',
  '/extension/sign-in': 'Sign In - Extension',
  '/profile': 'Profile',
  '/terms': 'Terms of Service',
  '/privacy': 'Privacy Policy',
  '/forgot-password': 'Forgot Password',
  '/change-password': 'Change Password',
  '/on-boarding': 'Onboarding',
  '/invite': 'Invite',
  '/accept-invite/:id/:action': 'Accept Invite',
  '/portfolios': 'Portfolios',
  '/dashboard': 'Dashboard',
  '/settings': 'Settings',
  '/settings/integrations/clickup': 'ClickUp Integrations',
  '/settings/integrations/hubspot': 'HubSpot Integrations',
  '/settings/integrations/clickup/profile': 'ClickUp Profile',
  '/settings/integrations/upwork': 'Upwork Integrations',
  '/proposals': 'Proposals',
  '/deals': 'Deals',
  '/deals/:dealId': 'Deal Details',
  '/contacts': 'Contacts',
  '/contacts/:slug': 'Contact Details',
  '/team-members': 'Team Members',
  '/contracts': 'Contracts',
  '/leads': 'Leads',
  '/profiles': 'Profiles',
  '/stripe': 'Stripe',
  '/stripe/payment-details': 'Payment Details',
  '/contact-us': 'Contact Us',
  '/business-data': 'Business Data',
  '/companies': 'Companies',
  '/companies/:companySlug': 'Company Details',
  '/maintenance': 'Maintenance',
};


export const AUTH_TOKEN = "AUTH_TOKEN";
export const USER_OBJECT = "USER_OBJECT";
export const COMPANY = "COMPANY"
export const TAGS_OBJECT = "TAGS_OBJECT";
export const DISMISSED_NOTIFICATIONS = "DISMISSED_NOTIFICATIONS";
export const FIREBASE_USER_NOT_FOUND = 'auth/user-not-found'
export const FIREBASE_AUTH_INVALID_CREDENTIALS = "auth/invalid-credential"
export const FIREBASE_AUTH_INVALID_LOGIN_CREDENTIALS = "INVALID_LOGIN_CREDENTIALS"
export const FIREBASE_AUTH_INVALID_VERIFICATION_CODE = "auth/invalid-verification-code"
export const FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE = "auth/code-expired"
export const FIREBASE_AUTH_OPERATION_NOT_ALLOWED = "auth/operation-not-allowed"
export const FIREBASE_AUTH_POP_UP_BLOCKED = "auth/popup-blocked"
export const FIREBASE_AUTH_NETWORK_REQUEST = "auth/network-request-failed"
export const FIREBASE_AUTH_CANCEL_POP_UP = "auth/cancelled-popup-request"
export const FIREBASE_AUTH_USER_DISABLED = "auth/user-disabled"
export const FIREBASE_AUTH_TOO_MANY_REQUESTS = "auth/too-many-requests"
export const FIREBASE_AUTH_INVALID_PHONE_NUMBER = "auth/invalid-phone-number"
export const FIREBASE_AUTH_RECAPTCHA_FAILED = "auth/recaptcha-error"
export const FIREBASE_AUTH_PHONENUMBER_NOT_SUPPORTED = "auth/recaptcha-error"
export const FIREBASE_AUTH_BILLING_DISABLED = "auth/billing-not-enabled"
export const FIREBASE_AUTH_EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use'
export const FIREBASE_AUTH_WRONG_PASSWORD = "auth/wrong-password"
export const FIREBASE_AUTH_EXPIRED_CODE = "auth/expired-action-code"
export const FIREBASE_AUTH_INVALID_CODE = "auth/invalid-action-code"
export const FIREBASE_AUTH_EMAIL_CODE = "oobCode"
export const ERROR_RATE_LIMIT_EXCEED = 'Request limit exceeded. Please wait a moment and try again.'

export const MAINTENANCE = "MAINTENANCE_MODE"

export const NOT_ALLOWED_TIP = 'You do not have permission to perform this task.'
export const SINGLE_INTEGRATION_ONLY_TIP = 'You can integrate with one platform at a time. Please choose either HubSpot or ClickUp.'

export const EXCEPTIONS = {
  EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS",
  EMAIL_OR_PASSWORD_INCORRECT: "EMAIL_OR_PASSWORD_INCORRECT",
  USER_EMAIL_NOT_VERIFIED: "USER_EMAIL_NOT_VERIFIED",
  ALREADY_HAS_A_COMPANY: "ALREADY_HAS_A_COMPANY",
  WRONG_TOKEN: "WRONG_TOKEN",
  COMPANY_NOT_FOUND: "COMPANY_NOT_FOUND",
  COMPANY_EMAIL_NOT_VERIFIED: "COMPANY_EMAIL_NOT_VERIFIED",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  FORGOT_PASSWORD_TOKEN_EXPIRED: "FORGOT_PASSWORD_TOKEN_EXPIRED",
  USER_HAS_ALREADY_SIGNED_UP: "USER_HAS_ALREADY_SIGNED_UP",
  MANAGER_CAN_ONLY_INVITE_BIDDERS: "MANAGER_CAN_ONLY_INVITE_BIDDERS",
  COPMANY_ADMIN_CAN_ONLY_INVITE_MANAGER_AND_BIDDER: "COPMANY_ADMIN_CAN_ONLY_INVITE_MANAGER_AND_BIDDER",
  MANAGER_CAN_ONLY_UPDATE_BIDDERS_INVITE: "MANAGER_CAN_ONLY_UPDATE_BIDDERS_INVITE",
  INVITATION_NOT_FOUND: "INVITATION_NOT_FOUND",
  ALREADY_HAVE_A_PROFILE: "ALREADY_HAVE_A_PROFILE",
  CANNOT_ADD_MEMBER_TO_JUST_ME: "CANNOT_ADD_MEMBER_TO_JUST_ME",
};


export const multiStepFormList = ['colorThemeId', 'name', 'logoUrl', 'websiteUrl', 'categories', 'location', 'companySize'];


export const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Upwork
export const CustomFieldsAvailable: CustomField[] = [
  // Job Fields
  {
    name: 'Job Title',
    id: 'name',
    required: true,
    isStaticField: true,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Job Title With Client Name',
    id: 'titleWithClientName',
    required: true,
    isStaticField: true,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Job Description',
    id: 'description',
    required: false,
    isStaticField: true,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Category',
    id: 'category',
    required: false,
    type: ['text', 'short_text', 'string', 'enumeration'],
  },
  {
    name: 'Posted Date',
    id: 'postedDate',
    required: false,
    type: ['date', 'datetime'],
  },
  {
    name: 'Experience Level',
    id: 'experienceLevel',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Hourly Range',
    id: 'hourlyRange',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Hourly',
    id: 'hourly',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Project Length',
    id: 'projectLength',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Job URL',
    id: 'url',
    required: false,
    type: ['text', 'short_text', 'url', 'string'],
  },
  {
    name: 'Featured',
    id: 'featured',
    required: false,
    type: ['checkbox', 'bool'],
  },

  // Bid Fields
  {
    name: 'Bid Cover Letter',
    id: 'bidCoverLetter',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Bid URL',
    id: 'bidURL',
    required: false,
    type: ['text', 'short_text', 'url', 'string'],
  },
  {
    name: 'Boosted',
    id: 'boosted',
    required: false,
    type: ['checkbox', 'bool'],
  },
  {
    name: 'Connects',
    id: 'connects',
    required: false,
    type: ['text', 'short_text', 'number', 'string'],
  },
  {
    name: 'Upwork Profile',
    id: 'profile',
    required: false,
    type: ['users'],
  },
  {
    name: 'Business Developer Profile',
    id: 'bidderProfile',
    required: false,
    type: ['users'],
  },
  {
    name: 'Upwork Profile Name',
    id: 'profileName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Business Developer Name',
    id: 'bidderName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Proposed Rate',
    id: 'rate',
    required: false,
    type: ['currency', 'number', 'string'],
  },
  {
    name: 'Response Date',
    id: 'responseDate',
    required: false,
    type: ['date', 'datetime'],
  },
  {
    name: 'Bid Question Answer',
    id: 'bidQuestions',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Is-Invite',
    id: 'invite',
    required: false,
    type: ['checkbox', 'bool'],
  },

  // Account Fields
  {
    name: 'Upwork Account Rating',
    id: 'accountRating',
    required: false,
    type: ['emoji', 'number', 'short_text', 'text', 'string'],
  },
  {
    name: 'Client Name',
    id: 'clientName',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client Country',
    id: 'clientCountry',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client State',
    id: 'clientState',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client Timezone',
    id: 'clientTimezone',
    required: false,
    type: ['short_text', 'text', 'string'],
  },

];

export const CustomFieldsAvailableContacts: CustomField[] = [
  {
    name: 'Upwork Account Rating',
    id: 'accountRating',
    required: false,
    type: ['emoji', 'number', 'short_text', 'text', 'string'],
  },
  {
    name: 'Client Name',
    id: 'clientName',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client Country',
    id: 'clientCountry',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client State',
    id: 'clientState',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
  {
    name: 'Client Timezone',
    id: 'clientTimezone',
    required: false,
    type: ['short_text', 'text', 'string'],
  },
];
// LinkedIn
export const CustomFieldsAvailableLinkedIn: CustomField[] = [
  // Job Fields
  {
    name: 'Full Name',
    id: 'fullName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'First Name',
    id: 'firstName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Last Name',
    id: 'lastName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Profile Headline',
    id: 'profileHeadline',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Location',
    id: 'location',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Connection Date',
    id: 'connectionDate',
    required: false,
    type: ['date', 'datetime'],
  },
  {
    name: 'Connections Count',
    id: 'connectionsCount',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Followers',
    id: 'followers',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Email',
    id: 'email',
    required: false,
    type: ['text', 'short_text', 'string', 'email'],
  },
  {
    name: 'Phone',
    id: 'phone',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Website',
    id: 'website',
    required: false,
    type: ['text', 'short_text', 'string', 'url'],
  },
  {
    name: 'LinkedIn Profile',
    id: 'linkedinProfile',
    required: false,
    type: ['text', 'short_text', 'string', 'url'],
  },
  {
    name: 'Industry',
    id: 'industry',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Latest Company Name',
    id: 'latestCompanyName',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
  {
    name: 'Latest Company Location',
    id: 'latestCompanyLocation',
    required: false,
    type: ['text', 'short_text', 'string'],
  },
];

export const CustomInjection = {
  PROJECT: '{{project}}',
  LINK: '{{link}}',
  CASE_STUDY: '{{caseStudy}}'
}

export const RESET_STORE = 'RESET_STORE'

export enum TABS {
  UPWORK = 'UPWORK',
  LINKEDIN = 'LINKEDIN'
}
export interface IModal {
  show: boolean,
  id?: string
  slug?: string
}