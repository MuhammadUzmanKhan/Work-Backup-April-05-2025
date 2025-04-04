# coram-common-Utils

This package contains common utilities that are used across the frontend applications. If you have a utility that should
be shared between web and mobile, it should be placed here. These can be functions, hooks or logic-only components.

**Note**: This package should not contain any UI components, because react-native does not support web components (and
vice-versa).

## Auto-Generated backend API client

This package also "contains" the auto-generated backend API client. This client is generated using the OpenAPI
specification of the backend. The files are not checked in with git, but are generated during the build process instead.
As such, we always do the following steps when working with a frontend application:

- install this package;
- generate the API client in this package;
- install the frontend application which depends on this package.

So that the API client is copied in the `node_modules` of the frontend application during the build process.
