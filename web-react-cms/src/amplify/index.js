import Amplify, { Auth } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.REACT_APP_AMPLIFY_REGION,
    userPoolId: process.env.REACT_APP_AMPLIFY_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_AMPLIFY_USER_POOL_WEB_CLIENT_ID,
    oauth: {
      domain: process.env.REACT_APP_AMPLIFY_DOMAIN,
      scope: ['email', 'openid'],
      redirectSignIn: process.env.REACT_APP_AMPLIFY_REDIRECT_SIGN_IN,
      redirectSignOut: process.env.REACT_APP_AMPLIFY_REDIRECT_SIGN_UP,
      responseType: 'code'
    }
  },
  API: {
    endpoints: [
      {
        name: 'MyAPIGatewayAPI',
        endpoint: process.env.REACT_APP_API_GATE_WAY,
        region: process.env.REACT_APP_AMPLIFY_REGION,
        scope: 'email, openid',
        custom_header: async () => {
          return {
            authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}`
          };
        }
      }
    ]
  }
});
