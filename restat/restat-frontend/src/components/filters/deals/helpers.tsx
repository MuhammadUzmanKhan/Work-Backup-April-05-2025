import { Filters_Type, Status_Type } from "../../../services/types/common";

export const formatLabel = (value: Filters_Type): string => {
  switch (value) {
    case Filters_Type.REGULAR:
      return 'Regular';
    case Filters_Type.DIRECT:
      return 'Direct';
    case Filters_Type.BOOSTED:
      return 'Boosted';
    case Filters_Type.INVITES:
      return 'Invites';
    case Filters_Type.INVITE_ONLY:
      return 'Invites Only';
    default:
      return value;
  }
};


export const statusFormatLabel = (value: Status_Type): string => {
  switch (value) {
    case Status_Type.LEADS:
      return 'Leads';
    case Status_Type.CONTRACTS:
      return 'Contracts';
    case Status_Type.PROPOSALS:
      return 'Proposals'
    default:
      return value;
  }
};