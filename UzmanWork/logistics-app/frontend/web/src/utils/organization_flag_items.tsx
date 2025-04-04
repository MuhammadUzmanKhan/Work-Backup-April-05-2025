import { ExposedOrgFlags } from "coram-common-utils";
import {
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  NoCrash as CarIcon,
  SupportAgent as SupportAgentIcon,
} from "@mui/icons-material";

export interface OrgFlagListItemData {
  flagEnum: ExposedOrgFlags;
  Icon: React.ElementType;
  primaryText: string;
  secondaryText: string;
}

export const ORG_FLAG_LIST_ITEMS: OrgFlagListItemData[] = [
  {
    flagEnum: ExposedOrgFlags.FACE_ENABLED,
    Icon: PersonIcon,
    primaryText: "Person of Interest",
    secondaryText:
      "Enables facial recognition technology and notifications for a person of Interest",
  },
  {
    flagEnum: ExposedOrgFlags.INACTIVITY_LOGOUT_ENABLED,
    Icon: AccountBalanceIcon,
    primaryText: "HIPAA Compliance",
    secondaryText: "Logs out a user if no activity is detected for 10 minutes",
  },
  {
    flagEnum: ExposedOrgFlags.LICENSE_PLATE_RECOGNITION_ENABLED,
    Icon: CarIcon,
    primaryText: "License Plate Recognition",
    secondaryText:
      "Activate license plate recognition for the cameras, granting you the ability to independently manage license plate recognition for each camera.",
  },
  {
    flagEnum: ExposedOrgFlags.SUPPORT_TEAM_DISABLED,
    Icon: SupportAgentIcon,
    primaryText: "Disable access for support team",
    secondaryText:
      "The support team has access to your dashboard and can proactively fix any issues. Enabling this option will ensure that no one from the support team can access your dashboard.",
  },
];
