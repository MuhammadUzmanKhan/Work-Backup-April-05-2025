import { DotMapDot, DotMapVendor } from '@ontrack-tech-group/common/models';

export type ShiftsToCreateInterface = {
  event_id: number;
  name: string;
  start_date: string;
  end_date: string;
  pos_id?: string;
};

// Define an interface that represents the attributes of your models
export interface NamedEntity {
  id: number;
  name: string;
  company_id: number;
}

// Define an interface that represents the attributes of dot socket data
export interface DotSockets {
  dot?: DotMapDot;
  message?: string;
  dots?: DotMapDot[];
  missingDotsCount?: number;
  priorityDotsCount?: number;
  deletedDots?: {
    id: number;
    vendor: { id: number };
    area: { id: number };
    position: { id: number };
  }[];
}

export interface WithOldDataDotSockets extends DotSockets {
  oldDot?: DotMapDot;
}

export interface VendorSockets {
  vendors?: DotMapVendor[];
  message?: string;
}

export interface CreateShift {
  rate: number;
  shift_id: number;
  dot_id: number;
  staff: number;
}

export interface BudgetSummaryPosition {
  staff: number;
  position: string;
  dotCount: number;
  avgRate: number;
  totalRate: number;
  totalHours: number;
}
