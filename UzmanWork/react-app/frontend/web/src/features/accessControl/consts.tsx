import { ReactNode } from "react";
import { BrivoIcon } from "icons/brivo-icon";
import { AvigilonAltaIcon } from "icons/avigilon-alta-icon";

export const SHOW_SET_API_KEY_DIALOG_QUERY_PARAM = "brivo-set-api-key";

export const SUPPORTED_VENDORS: Record<
  string,
  { name: string; icon: ReactNode }
> = {
  brivo: {
    name: "Brivo",
    icon: <BrivoIcon />,
  },
  alta: {
    name: "Avigilon Alta",
    icon: <AvigilonAltaIcon />,
  },
};
