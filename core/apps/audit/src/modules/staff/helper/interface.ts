export interface DashboardData {
  assets: AssetForStats[];
  totalAssets: number;
  totalVendors: number;
  totalStaff: TotalStaff;
  orderedVsDelivered: OrderedVsDelivered;
  totalStaffDashboard: TotalStaffDashboard;
  totalStaffPositionDashboard: TotalStaffPositionDashboard;
}

export interface AssetForStats {
  totalCount: number;
  totalCheckedInCount: number;
  vendorName: string;
}

interface TotalStaff {
  totalVendors: number;
  allPositionCount: PositionCount[];
}

export interface PositionCount {
  vendorPositionTotalCount: number;
  vendorPositionCheckedInCount: number;
  vendorPositionName: string;
}

export interface OrderedVsDelivered {
  totalRate: number;
  currentRate: number;
  checkedInPercentage: number;
}

interface TotalStaffDashboard {
  all: DashboardSummary;
  shifts: ShiftSummary[];
}

interface DashboardSummary {
  totalCount: number;
  totalCheckedInCount: number;
  vendorCounts: VendorCount[];
  totalRate: number;
  currentRate: number;
  checkedInPercentage: number;
}

interface VendorCount {
  totalCount: number;
  totalCheckedInCount: number;
  vendorName: string;
}

export interface ShiftSummary {
  totalCount: number;
  totalCheckedInCount: number;
  checkedInPercentage: number;
  totalRate: number;
  vendorCounts: VendorCount[];
  currentRate: number;
  shiftName: string;
  shiftId: number;
  startDate: string; // ISO 8601 format
}

interface TotalStaffPositionDashboard {
  all: PositionDashboardSummary;
  shifts: PositionShiftSummary[];
}

interface PositionDashboardSummary {
  totalCount: number;
  totalCheckedInCount: number;
  positionCounts: PositionCountDetail[];
  totalRate: number;
  currentRate: number;
  checkedInPercentage: number;
}

export interface PositionCountDetail {
  totalCount: number;
  totalCheckedInCount: number;
  positionName: string;
}

export interface PositionShiftSummary {
  totalCount: number;
  totalCheckedInCount: number;
  checkedInPercentage: number;
  totalRate: number;
  positionCounts: PositionCountDetail[];
  currentRate: number;
  shiftName: string;
  shiftId: number;
  startDate: string; // ISO 8601 format
}

export interface StatsSerializer {
  assets: AssetForStats[];
  totalAssets: number;
  allPositionCount: PositionCount[];
  orderedVsDelivered: OrderedVsDelivered;
  totalCheckedInAssets: number;
  shiftsVendorCounts: ShiftSummary[];
  allPositionCounts: PositionCountDetail[];
  shiftsPositionCounts: PositionShiftSummary[];
}

export interface GetStats {
  all: StaffStats & { vendors: number };
  shifts: (Shift & { statsData?: StaffStats })[];
}

export interface VendorInterface {
  id: number;
  name: string;
  contact_name: string;
  first_name: string;
  last_name: string;
  cell: string | null;
  contact_email: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contact_phone: string | null;
  color: string | null;
  note: string | null;
  type: string;
  company_id: number;
  createdAt: string;
  updatedAt: string;
  staff: Staff[];
  deletedStaff: Staff[];
}

export interface Staff {
  id: number;
  qr_code: string | null;
  aligned_checked_in: string | null;
  aligned_checked_out: string | null;
  is_flagged: boolean;
  rate: number;
  checked_in: string | null;
  checked_out: string | null;
  pos: string | null;
  vendor_id: number;
  vendor_position_id: number;
  shift_id: number;
  createdAt: string;
  updatedAt: string;
  shift: Shift;
  currentRate: number;
  totalRate: number;
  addition: boolean;
  deleted_at: Date | null;
}

export interface Shift {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  event_id: number;
  createdAt: string;
  updatedAt: string;
}

export interface RateData {
  totalRate: number;
  currentRate: number;
  variance: number;
}

export interface StaffStats {
  rateDataForRemovals: RateData;
  rateDataForAdditions: RateData;
  allRateData: RateData & { addOnValue: number };
  additions: number;
  removals: number;
  currentCheckedInPercentage: string;
  totalCheckedInPercentage: string;
  notCheckedInPercentage: string;
  totalCheckedOutPercentage: string;
  checkedOutPercentage: string;
  currentCheckedInStaff: number;
  checkedInStaff: number;
  checkedOutStaff: number;
  staffNotCheckedIn: number;
  totalStaffCount: number;
}

export type GetStatsSummary = StaffStats & { vendors: number };
