import { Organization } from "../backend_client";
import { atom } from "recoil";

export const selectedOrganization = atom<Organization | null>({
  key: "selectedOrganization",
  default: null,
});
