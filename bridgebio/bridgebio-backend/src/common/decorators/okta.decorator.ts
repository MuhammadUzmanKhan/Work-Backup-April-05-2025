import { SetMetadata } from "@nestjs/common";

export const IS_OKTA_USER = 'isOktaUser';
export const OktaUser = () => SetMetadata(IS_OKTA_USER, true);