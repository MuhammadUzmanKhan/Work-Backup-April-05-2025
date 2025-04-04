import { IContact } from "./contacts";

export enum EmployeeRange {
  NULL = '',
  SMALL = "1-10",
  MEDIUM = "11-50",
  LARGE = "51-100",
  XLARGE = "101-500",
  XXLARGE = "501-1000",
  ENTERPRISE = "1000+",
}

export interface ICompanies {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  location?: string;
  foundedYear?: Date;
  fundedInfo?: string;
  businessType?: string;
  colorThemeId?: string;
  categories?: string[];
  numberOfEmployees?: EmployeeRange;
  address?: string;
  country?: string;
  state?: string;
  website?: string;
  socialMediaUrls?: string;
  hubspotCompanyId?: string;
  source?: string;
  contact?: IContact;
}
