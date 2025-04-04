import { FormikHandlers, FormikProps, FormikTouched } from "formik";
import { PORTFOLIO_TYPE } from "./portfolio_types";

interface HeaderProps {
  title: string;
  subTitle: string;
  handleClick: () => void;
}

interface ProtectedRouteProps {
  children: JSX.Element;
}

interface Themes {
  colors: {
    primaryColor: string;
  };
  id: string;
  name: string;
}

interface Categories {
  id: string;
  name: string;
}

interface SvgAsReactComponentProps {
  className?: string;
  fillColor?: string | null;
  width?: number
}

interface MemberProps {
  name: string;
  email: string;
  role: string;
  upworkTarget: number;
  linkedinTarget: number;

}

interface ErrorProps {
  [key: string]: string;
}

interface AddAnotherUserProps {
  validateForm: any;
  push: <X = any>(obj: X) => void;
  setTouched: any;
}

interface InviteSubmitProps {
  members: MemberProps[];
}

interface SendInviteFormProps
  extends Pick<FormikProps<FormikHandlers>, "handleChange" | "handleBlur"> {
  touched: FormikTouched<InviteSubmitProps>;
  member: MemberProps;
  index: number;
  setFieldValue: any;
  errors: any;
  remove: any
}
interface PortfolioValues {
  name: string;
  description: string;
  links?: {
    title: string;
    url: string;
  }[];
  selectedTags?: {
    id: string;
    name: string;
    source: Source;
  }[];
}

interface PortfolioHandleSubmitProps {
  values: PortfolioValues,
  setErrors: any
}
interface PortfolioProps {
  name: string;
  description: string;
  type: PORTFOLIO_TYPE;
  links?: {
    title: string;
    url: string;
  }[];
  tags?: {
    id: string;
    name: string;
    source: Source;
  }[];
}

interface UpdatePortfolioProps {
  id?: string;
  name?: string;
  description?: string;
  type?: PORTFOLIO_TYPE;
  links?: {
    title: string;
    url: string;
  }[];
  tags?: {
    id: string;
    name: string;
    source: Source;
  }[]
}

interface LinkProps {
  title: string;
  url: string;
}
interface LinkSubmitProps {
  members: LinkProps[];
}
interface AddLinksProps {
  touched: any;
  errors: any;
  link: LinkProps;
  handleChange: FormikProps<LinkSubmitProps>["handleChange"];
  index: number;
  handleBlur: FormikProps<LinkSubmitProps>["handleBlur"];
  removeLink: any;
  duplicateUrlsError?: any
}


interface AddAnotherLinkProps {
  validateForm: any;
  push: <X = any>(obj: X) => void;
  setTouched: any;
  values?: any;
  setErrors?: any
}

interface Tags {
  id: string;
  name: string;
  source: Source;
}

interface TagsProps {
  values: PortfolioValues;
  errors: any;
}

enum Source {
  UPWORK = "Upwork",
  CUSTOM = "Custom",
}

enum ProfileSource {
  UPWORK = "UPWORK",
  LINKEDIN = "LINKEDIN",
}

enum CONTACT_SOURCE {
  UPWORK = "UPWORK",
  LINKEDIN = "LINKEDIN",
}

enum Modal {
  VIEW = "VIEW",
  DELETE = "DELETE"
}

enum ROLE {
  SUPER_ADMIN = "SUPER_ADMIN",
  OWNER = "OWNER",
  COMPANY_ADMIN = "COMPANY_ADMIN",
  MANAGER = "MANAGER",
  BIDDER = "BIDDER",
}

enum BidTypes {
  PROPOSALS = 'PROPOSALS',
  LEADS = 'LEADS',
  CONTRACTS = 'CONTRACTS',
  ALL = 'ALL'
}

enum SOURCE {
  UPWORK = 'UPWORK',
  LINKEDIN = 'LINKEDIN'
}

enum LINKEDIN_SUBTYPE {
  CONNECTION = 'CONNECTION',
  PROSPECT = 'PROSPECT'
}


enum Filters_Type {
  REGULAR = 'REGULAR',
  DIRECT = 'DIRECT',
  BOOSTED = 'BOOSTED',
  INVITES = 'INVITES',
  INVITE_ONLY = 'INVITE_ONLY',
}

enum Status_Type {
  PROPOSALS = 'PROPOSALS',
  LEADS = 'LEADS',
  CONTRACTS = 'CONTRACTS'
}



enum HUBSPOT_CATEGORYS {
  DEALS = 'DEALS',
  CONTACTS = 'CONTACTS',
  COMPANIES = 'COMPANIES'
}


enum INTEGRATION_OPTIONS {
  CLICKUP = 'CLICKUP',
  HUBSPOT = 'HUBSPOT'
}


export enum ProfileType {
  UPWORK = "UPWORK",
  LINKEDIN = "LINKEDIN",
}
enum userStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}
interface CreatePortfolioProps {
  title: string;
  type: PORTFOLIO_TYPE;
  showLinks: boolean;
  bg: string
}

interface Portfolio {
  name?: string;
  description?: string
  type?: PORTFOLIO_TYPE,
  links?: Array<{
    title: string;
    url: string;
  }>
  tags?: Array<Tags>
}


interface PortfolioTableHeadings {
  id: string;
  title: string;
  tags: string;
  createdAt: string;
  type: string;
  actions: string;
}

interface BidsTableHeadings {
  name: string;
  date: string;
  rate: string;
  invite?: string;
  bidder: string;
  profile: string;
  url: string;
  actions: string;
}

interface UsersTableHeadings {
  userName: string;
  email: string;
  role: string;
  joiningDate: string;
  clickup: string;
  actions: string;
}

interface ViewUsersTableHeadings {
  userNameView: string;
  emailView: string;
  switch: string;
}

interface PendingInvitesTableHeadings {
  title: string;
  email: string;
  role: string;
  invitationDate: string;
  actions: string;
}

interface UpworkProfilesTableHeadings {
  profileName: string;
  profileURL: string;
  createdDate: string;
  source: string;
  clickup: string;
  actions: string;
}

interface AccountsTableHeadings {
  accountName: string;
  accountEmail: string;
  accountCompany: string;
  accountLocation: string;
  accountPaymentMethod: string;
  accountRating: string,
  // actions: string
}

interface BidsObject {
  [key: string]: any;
}

interface UsersObject {
  [key: string]: any;
}
interface UserStatus {
  status: userStatus;
}
interface ProfileObject {
  [key: string]: any;
}

interface CustomerObject {
  name: string;
  email: string;
  paymentMethod: string;
}

interface UpdatePaymentMethod {
  customerId: string;
  paymentMethodId: string;
}

interface SubscriptionObject {
  customerId: string;
  paymentMethodId: string;
  planId: string;
}

interface AccountsObject {
  [key: string]: any;
}


interface PortfolioObject {
  id: string;
  name: string;
  type: PORTFOLIO_TYPE;
  description: string;
  tags: Array<any>
  links: Array<any>
  createdAt?: any
}

interface DatePickerInterface {
  handleSelect: (date: any) => void;
}

interface Space {
  id: any;
  name: string;
}


interface Folders {
  id: string;
  name: string;
  lists: ClickUpList[]
}

interface ClickUpStatus {
  id: string;
  status: string
}

interface ClickUpList {
  id: any;
  name: string;
  statuses: ClickUpStatus[]
}

interface CustomField {
  id: string;
  name: string;
  required: boolean;
  type: ('text' | 'number' | 'currency' | 'short_text' | 'email' | 'date' | 'users' | 'emoji' | 'url' | 'checkbox' | 'upwork_profile' | 'datetime' | 'string' | 'enumeration' | 'bool')[];
  isStaticField?: boolean,
}

interface ClickupCustomField {
  id: string;
  name: string;
  required: boolean;
  type: 'text' | 'number' | 'currency' | 'short_text' | 'email' | 'date' | 'users' | 'emoji' | 'url' | 'checkbox' | 'upwork_profile' | 'datetime' | 'string' | 'enumeration' | 'bool';
  isStaticField?: boolean,
}
interface SelectedFields {
  key?: string;
  name?: string;
  value?: string;
  type?: string;
  isBlank?: boolean;
  required?: boolean;
  isStaticField?: boolean;
  customFieldName?: string;
}

enum INTEGRATION_TYPE {
  UPWORK = 'UPWORK',
  LINKEDIN = 'LINKEDIN'
}

interface SelectedProperties {
  key?: string;
  value?: string;
  valueName?: string;
  isStaticValue?: boolean;
  name?: string;
  label?: string;
  type?: string;
  hubspotDefined?: boolean;
  hubspotCategory: string;
  integration: INTEGRATION_TYPE
}

interface Member {
  id: number;
  username: string;
  email: string;
  color: string;
  initials: string;
  profilePicture?: string;
}


interface DateProps {
  startDate: Date | null,
  endDate: Date | null,
  selected: boolean,
}

interface ILocation {
  country?: string;
  state?: string;
}

interface ISocialMediaHandles {
  Facebook?: string;
  Twitter?: string;
  Linkedin?: string;
}

interface IClientExperience {
  totalYears?: string;
  jobTitles?: string[];
  organizationName?: string;
}

interface IHistory {
  proposals?: string;
  interviews?: string;
  jobsPosted?: string;
  totalSpent?: string;
  hoursBilled?: string;
  openJobs?: string;
  hires?: string;
  hired?: string;
  memberJoined?: string;
}

export interface Client {
  id?: string;
  timeZone?: string;
  numberOfEmployees?: string;
  designation?: string;
  industry?: string;
  companyAge?: string;
  funding?: string;
  currentInterview?: string;
  decisionMaker?: boolean;
  specialInterest?: string;
  accountCompany?: string;
  accountEmail?: string | null;
  accountLocation?: ILocation;
  accountName?: string;
  accountPaymentMethod?: string;
  accountRating?: string | null;
  createdAt?: string;
  history?: IHistory;
  numReviewsUpwork?: string | null;
  phoneNumber?: string | null;
  rating?: string;
  source?: string;
  upWorkRating?: string | null;
  upworkPlus?: boolean;
  socialMediaHandles?: ISocialMediaHandles;
  clientsExperience?: IClientExperience;
}


// src/services/types/common.ts
export interface LeadFormData {
  bidProfileId: string
  bidCoverLetter: string
  bidProfileFreelancer: string
  bidProfileAgency: string
  bidProfileBusinessManager: string
  userId: string
  upworkProposalUrl: string
  connects: string,
  boosted: boolean,
  bidResponse: boolean,
  responseDate: string,
  contractDate: string,
  invite: boolean,
  proposedProfile: string
  proposedRate: string
  receivedAmount: string
  jobUrl: string
  jobTitle: string
  jobDescription: string
  jobPosted: string
  contactName: string
  contactCountry: string
  contactState: string
  isManual: boolean,
}
export interface BusinessManagerProfile {
  clickupEmail: string;
  clickupProfilePicture: string;
  clickupUsername: string;
  createdDate: string;
  id: string;
  name: string;
  url: string;
}
export interface AccountManagerProfile {
  clickupEmail: string | null;
  clickupProfilePicture: string | null;
  clickupUsername: string | null;
  email: string;
  id: string;
  joiningDate: string;
  linkedinTarget: number;
  name: string;
  role: string;
  upworkTarget: number;
}
interface Features {
  onBoardingCenter: boolean;
  clickUp: boolean;
  hubSpot: boolean;
  upwork: boolean;
  stripe: boolean;
  linkedIn: boolean;
  dashboard: boolean;
  settings: boolean;
  upworkProfiles: boolean;
  businessData: boolean;
  contactUs: boolean;
  companies: boolean;
  team: boolean;
  contacts: boolean;
  deals: boolean;
  portfolios: boolean;
}

interface GlobalConfiguration {
  id: string;
  companyId: string | null;
  features: Features;
  timeout: number;
}

interface IWorkspaceData {
  name: string;
  websiteUrl: string;
  phoneNumber: string;
  companySize: string;
  logoUrl: string;
  location: string;
  colorThemeId: string;
}

export {
  Member,
  DateProps,
  SelectedFields,
  SelectedProperties,
  HUBSPOT_CATEGORYS,
  CustomField,
  INTEGRATION_TYPE,
  ClickupCustomField,
  Space,
  Folders,
  ClickUpStatus,
  ClickUpList,
  HeaderProps,
  ProtectedRouteProps,
  Themes,
  Categories,
  SvgAsReactComponentProps,
  MemberProps,
  ErrorProps,
  AddAnotherUserProps,
  InviteSubmitProps,
  SendInviteFormProps,
  AddAnotherLinkProps,
  AddLinksProps,
  LinkSubmitProps,
  PortfolioProps,
  PortfolioValues,
  Tags,
  TagsProps,
  Source,
  CreatePortfolioProps,
  PortfolioTableHeadings,
  PendingInvitesTableHeadings,
  PortfolioObject,
  PortfolioHandleSubmitProps,
  UpdatePortfolioProps,
  Modal,
  BidsTableHeadings,
  BidsObject,
  UsersTableHeadings,
  UpworkProfilesTableHeadings,
  UsersObject,
  DatePickerInterface,
  ProfileSource,
  AccountsTableHeadings,
  AccountsObject,
  ROLE,
  BidTypes,
  SOURCE,
  LINKEDIN_SUBTYPE,
  ProfileObject,
  Filters_Type,
  Status_Type,
  GlobalConfiguration,
  INTEGRATION_OPTIONS,
  CONTACT_SOURCE,
  IWorkspaceData,
  Portfolio,
  CustomerObject,
  SubscriptionObject,
  ViewUsersTableHeadings,
  userStatus,
  UserStatus,
  Features,
  UpdatePaymentMethod,
};

