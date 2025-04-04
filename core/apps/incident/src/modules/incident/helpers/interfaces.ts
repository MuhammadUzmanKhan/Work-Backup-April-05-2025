import { HttpService } from '@nestjs/axios';
import { Request, Response } from 'express';
import {
  GraphDataInterface,
  ObjectWithNumbersValue,
} from '@ontrack-tech-group/common/constants';
import {
  Incident,
  IncidentDivision,
  IncidentType,
  IncidentZone,
  Event,
} from '@ontrack-tech-group/common/models';

export interface CreateByOrUpdateBy {
  id?: number;
  name?: string;
  cell?: string;
  type?: string;
}

export interface GetIncidentLegalCount {
  archived?: number;
  concluded?: number;
  open?: number;
}

// Define the type for dynamic priorities
export type PriorityCounts = {
  [key: string]: number;
};

// Define the type for each status, which includes the totalCount and the dynamic priorities
export type CountsByStatusAndPriority = {
  [key: string]: {
    totalCount: number;
  } & PriorityCounts; // Intersection with the dynamic priorities
};

export interface GetIncidentCount {
  totalCounts: CountsByStatusAndPriority;
  dispatchedCounts: ObjectWithNumbersValue;
  resolvedIncidentNotesCount: {
    resolved: number;
  } & ObjectWithNumbersValue;
}

export interface GeneratePdfForEventIncidentReport {
  incident: Incident;
  req: Request;
  res: Response;
  httpService: HttpService;
  withChangelogs: boolean;
  timezone: string;
}

export interface FormatAndGenerateCsv {
  incidents: Incident[];
  timezone: string;
  req: Request;
  res: Response;
  httpService: HttpService;
}

export interface GeneratePdfForDashboard {
  graphData: GraphDataInterface;
  event: Event;
  incidentTypes: IncidentType[];
  incidentZones: IncidentZone[];
  incidentDivisions: IncidentDivision[];
  filename: string;
  imageUrl: string;
  req: Request;
  res: Response;
  httpService: HttpService;
}

export interface LegalCountsInterface {
  concluded: number;
  archived: number;
  open: number;
}
