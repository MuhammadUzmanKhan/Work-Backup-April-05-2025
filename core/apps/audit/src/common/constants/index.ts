export * from './responses';
export * from './enums';

export type ShiftsToCreateInterface = {
  event_id: number;
  name: string;
  start_date: string;
  end_date: string;
  index: number;
};

export type CsvVendorsInterface = {
  name: string;
  contact_name: string;
  cell: string;
  country_code: string;
  country_iso_code: string;
  contact_email: string;
  first_name: string;
  last_name: string;
  company_id: number;
};

export type VendorAssets = {
  totalCount: number;
  totalCheckedInCount: number;
  vendorName: string;
  vendorId: number;
  utc_start_date: string;
  date: string;
};
