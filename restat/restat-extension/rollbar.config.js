// rollbar.config.js
export default {
    accessToken: '27c653e197cd4e03a8060e6a854b5c55',
    captureUncaught: true,
    captureUnhandledRejections: true,
    payload: {
      environment: process.env.NODE_ENV ?? 'all',
      client: {
        javascript: {
          code_version: '1.7.11',
        },
      },
    },
  };