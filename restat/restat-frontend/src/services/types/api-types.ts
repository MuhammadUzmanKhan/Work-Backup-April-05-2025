// import { LinkProps } from "react-router-dom";

import { Tags } from "./common";
import { PORTFOLIO_TYPE } from "./portfolio_types";

export namespace ApiTypes {
  export interface Authenticate {
    idToken: string;
  }

  export interface AddUserProfile {
    location: string;
    colorThemeId: string | undefined;
    categories: string[];
  }

  export interface CreateCompany {
    name: string;
    websiteUrl?: string;
    logoUrl?: string;
    companySize: string;
    phoneNumber?: string;
  }

  export interface AddTeamMembers {
    name: string;
    email: string;
    role: string;
  }

  export interface Portfolio {
    name?: string;
    description?: string
    type?: PORTFOLIO_TYPE,
    links?: Array<{
      title: string;
      url: string;
    }>
    tags?: Array<Tags>
  }

}