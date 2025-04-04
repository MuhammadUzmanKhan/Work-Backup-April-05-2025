import { ROLE } from "./common";

export interface UserState {
  companyId: string;
  createdAt: string;
  phoneNumber: string,
  email: string;
  id: string;
  name: string;
  provider: string;
  role: ROLE;
  uid: string;
  updatedAt: string
  onBoardingCompleted: boolean
  company: {
    subscription: {
      isActive: boolean;
      allowedUsers: number;
    };
    settings: Settings
  }
}
export interface Settings {
  sessionTimeout: number
}