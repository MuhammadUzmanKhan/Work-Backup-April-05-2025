import OktaJwtVerifier from "@okta/jwt-verifier";

export const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.OKTA_DOMAIN!,
    jwksUri: `${process.env.OKTA_DOMAIN!}/oauth2/v1/keys`,
    clientId: process.env.OKTA_CLIENT_ID
});