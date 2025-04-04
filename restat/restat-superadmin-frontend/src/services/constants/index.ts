export const routes = {
    signIn: "/sign-in",
    otpVerification: "/otp-verification/:idToken",
    dashboard: "/",
    features: "/features",
    notifications: "/notifications",
    extensionNotification: "/extension-notification",
    workspaces: "/workspaces"
}

export const AUTH_TOKEN = "AUTH_TOKEN";
export const USER_OBJECT = "USER_OBJECT";
export const RESET_STORE = 'RESET_STORE'

export const FIREBASE_USER_NOT_FOUND = 'auth/user-not-found'
export const FIREBASE_AUTH_INVALID_CREDENTIALS = "auth/invalid-credential"
export const FIREBASE_AUTH_OPERATION_NOT_ALLOWED = "auth/operation-not-allowed"
export const FIREBASE_AUTH_POP_UP_BLOCKED = "auth/popup-blocked"
export const FIREBASE_AUTH_NETWORK_REQUEST = "auth/network-request-failed"
export const FIREBASE_AUTH_CANCEL_POP_UP = "auth/cancelled-popup-request"
export const FIREBASE_AUTH_USER_DISABLED = "auth/user-disabled"
export const FIREBASE_AUTH_TOO_MANY_REQUESTS = "auth/too-many-requests"
export const FIREBASE_AUTH_WRONG_PASSWORD = "auth/wrong-password"
export const FIREBASE_AUTH_EXPIRED_CODE = "auth/expired-action-code"
export const FIREBASE_AUTH_INVALID_CODE = "auth/invalid-action-code"
export const FIREBASE_AUTH_EMAIL_CODE = "oobCode"
export const USER_NOT_FOUND = "USER_NOT_FOUND"