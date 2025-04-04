import { customNotification } from "../../components";
import { FIREBASE_AUTH_BILLING_DISABLED, FIREBASE_AUTH_CANCEL_POP_UP, FIREBASE_AUTH_EMAIL_ALREADY_IN_USE, FIREBASE_AUTH_EMAIL_CODE, FIREBASE_AUTH_EXPIRED_CODE, FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE, FIREBASE_AUTH_INVALID_CODE, FIREBASE_AUTH_INVALID_CREDENTIALS, FIREBASE_AUTH_INVALID_LOGIN_CREDENTIALS, FIREBASE_AUTH_INVALID_PHONE_NUMBER, FIREBASE_AUTH_INVALID_VERIFICATION_CODE, FIREBASE_AUTH_NETWORK_REQUEST, FIREBASE_AUTH_OPERATION_NOT_ALLOWED, FIREBASE_AUTH_PHONENUMBER_NOT_SUPPORTED, FIREBASE_AUTH_POP_UP_BLOCKED, FIREBASE_AUTH_RECAPTCHA_FAILED, FIREBASE_AUTH_TOO_MANY_REQUESTS, FIREBASE_AUTH_USER_DISABLED, FIREBASE_AUTH_WRONG_PASSWORD, FIREBASE_USER_NOT_FOUND } from "../constants";

export const getInitials = (name: string) => {
  if(name) return name.split(' ').map(word => word[0]).join('').toUpperCase();
  else return ''
};

export const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

export function handleFirebaseError(e: any) {
  // App-specific error handling
  switch (e.response?.data?.message) {
    case FIREBASE_AUTH_INVALID_LOGIN_CREDENTIALS:
      return customNotification.error("Please check your email and password.");
    case "USER_IS_NOT_ACTIVE":
      return customNotification.error("User is not active.");
    case "USER_IS_DELETED":
      return customNotification.error("User is deleted.");
  }

  // Firebase error handling
  switch (e.code) {
    case FIREBASE_AUTH_INVALID_CREDENTIALS:
      return customNotification.error("The credentials for social login are invalid.");
    case FIREBASE_AUTH_POP_UP_BLOCKED:
      return customNotification.error("Please enable the popup window.");
    case FIREBASE_AUTH_NETWORK_REQUEST:
      return customNotification.error("Network connection failed.");
    case FIREBASE_AUTH_CANCEL_POP_UP:
      return customNotification.error("Complete the login process before closing the popup window.");
    case FIREBASE_AUTH_USER_DISABLED:
      return customNotification.error("This account has been disabled.");
    case FIREBASE_USER_NOT_FOUND:
      return customNotification.error("No account found with this email.");
    case FIREBASE_AUTH_WRONG_PASSWORD:
      return customNotification.error("Incorrect password.");
    case FIREBASE_AUTH_EMAIL_ALREADY_IN_USE:
      return customNotification.error("This email is already registered.");
    case FIREBASE_AUTH_OPERATION_NOT_ALLOWED:
      return customNotification.error("This operation is not allowed.");
    case FIREBASE_AUTH_TOO_MANY_REQUESTS:
      return customNotification.error("Too many requests. Please try again later.");
    case FIREBASE_AUTH_INVALID_PHONE_NUMBER:
      return customNotification.error("The provided phone number is invalid.");
    case FIREBASE_AUTH_RECAPTCHA_FAILED:
      return customNotification.error("Recaptcha verification failed.");
    case FIREBASE_AUTH_PHONENUMBER_NOT_SUPPORTED:
      return customNotification.error("Phone number authentication is not supported.");
    case FIREBASE_AUTH_BILLING_DISABLED:
      return customNotification.error("Billing is not enabled for this project.");
    case FIREBASE_AUTH_INVALID_VERIFICATION_CODE:
      return customNotification.error("Invalid verification code.");
    case FIREBASE_AUTH_EXPIRED_VERIFICATION_CODE:
      return customNotification.error("Verification code has expired.");
    case FIREBASE_AUTH_EXPIRED_CODE:
      return customNotification.error("The action code has expired.");
    case FIREBASE_AUTH_INVALID_CODE:
      return customNotification.error("The action code is invalid.");
    case FIREBASE_AUTH_EMAIL_CODE:
      return customNotification.error("The email action code is invalid or expired.");
  }

  // Default error handling
  return customNotification.error(e?.response?.data?.message || "Please refresh the page and try again!");
}
