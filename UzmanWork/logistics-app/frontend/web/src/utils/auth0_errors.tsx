import { isDefined } from "./types";

// If the message is one of these, we should log the user out.
// NOTE(@lberg): this is not great, but it's unclear how to get the status code
// from the error in Auth0. If we could do that, we could just match 403.
const LOG_OUT_ERRORS = [
  "invalid_grant",
  "Unsuccessful Refresh Token exchange, reused refresh token detected",
  "Unknown or invalid refresh token.",
];

interface Auth0Error {
  error: string;
}

function errorIsKnown(e: unknown): e is Auth0Error {
  return (
    typeof e === "object" &&
    isDefined(e) &&
    "error" in e &&
    typeof e["error"] === "string"
  );
}

export function errorShouldLogOut(e: unknown): boolean {
  return errorIsKnown(e) && LOG_OUT_ERRORS.includes(e.error);
}
