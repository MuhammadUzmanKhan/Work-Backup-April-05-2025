import { ModelCtor } from 'sequelize-typescript';

export type AssociatedDataType = [ModelCtor, string, ModelCtor, string];

export type AssetByVendor = {
  totalCount: number;
  totalCheckedInCount: number;
  checkedInPercentage: number;
  vendorName: string;
  vendorId: number;
};

export type TotalAssetsSummary = {
  date: string;
  assets: AssetByVendor[];
  totalAssets: number;
  totalCheckedInAssets: number;
  totalCheckedInPercentage: number;
};
