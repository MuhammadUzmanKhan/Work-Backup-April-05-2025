export interface GetAllVendors {
  id: number;
  name: string;
  totalStaff: number;
}

export type StatsForShift = {
  id: number;
  name: string;
  staff_count: number;
  checked_in: number;
  parent_id: number;
  parent_name: string;
};

export type VendorChildStats = {
  id: number;
  name: string;
  staff_count: number;
  checked_in: number;
};

export type GroupedVendorData = {
  parent_id: number;
  parent_name: string;
  staff_count: number;
  checked_in: number;
  shifts: VendorChildStats[];
};
