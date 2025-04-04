import { SelectedFields, SelectedProperties } from "./common";

export interface IStages {
  id: string;
  label: string;
  displayOrder: number;
}

export interface IPipeline {
  id: string;
  label: string;
  displayOrder: number;
  stages: IStages[];
  updatedAt: string;
  createdAt: string;
}

export interface UserHierarchy {
  id: string;
  name: string;
  role: string;
  deletedAt?: string;
}

export interface IClickupIntegrationDetails {
  subType: string;
  user: UserHierarchy;
  workspace: string;
  space: string;
  folder: string;
  list: string;
  status: string;
  isFolderlessList: boolean;
  isSharedHierarchy: boolean;
  updatedAt: string;
  customFields: SelectedFields[];
}

export interface IHubspotIntegrationDetails {
  user: UserHierarchy;
  pipelineName: string;
  stageName: string;
  updatedAt: string;
  customFields: SelectedProperties[];
}


interface ModificationMetadata {
  readOnlyValue: boolean;
  readOnlyDefinition: boolean;
  archivable: boolean;
}

export interface HubspotProperties {
  calculated: boolean;
  calculationFormula: string;
  createdAt: string;
  description: string;
  displayOrder: number;
  externalOptions: boolean;
  fieldType: string;
  formField: boolean;
  groupName: string;
  hasUniqueValue: boolean;
  hidden: boolean;
  hubspotDefined: boolean;
  label: string;
  modificationMetadata: ModificationMetadata;
  archivable: boolean;
  readOnlyDefinition: boolean;
  readOnlyValue: boolean;
  name: string;
  options: any[]; // Define the structure if known, e.g., { value: string, label: string }
  showCurrencySymbol: boolean;
  type: string | any;
  updatedAt: string;
}
