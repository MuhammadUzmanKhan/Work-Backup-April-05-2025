import { VendorPosition } from '@ontrack-tech-group/common/models';

export interface GetCountForAudit {
  totalStaff: number;
  checkedInStaff: number;
  notCheckedInStaff: number;
  totalVendors: number;
  totalOrders: number;
  deliveredOrders: number;
}

export interface Vendor {
  id: number;
  name: string;
}

export interface TransformedVendor {
  vendor_id: number;
  vendor_name: string;
}

export interface TransformedPosition {
  id: number;
  name: string;
  positions: VendorPosition[];
}

export interface PositionTableData {
  id: number;
  name: string;
  totalOrder: number;
  totalCheckedInStaff: number;
  currentCheckedInStaff: number;
  checkedOut: number;
  totalCheckedInPercentage?: number;
  totalCheckedOutPercentage?: number;
}
