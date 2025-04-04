import { ConfigService } from '@nestjs/config';
import * as OktaJwtVerifier from '@okta/jwt-verifier';

export const oktaVerifier = (configService: ConfigService) => {
    return new OktaJwtVerifier({
        issuer: configService.get('OKTA_DOMAIN'),
        jwksUri: `${configService.get('OKTA_DOMAIN')!}/oauth2/v1/keys`,
        clientId: configService.get('OKTA_CLIENT_ID')
    });
};