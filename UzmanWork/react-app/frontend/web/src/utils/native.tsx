import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

// Close the browser if it is open. Perform the operation on iOS only.
// This is because the function throws on Android (it should not).
export async function browserClose() {
  try {
    if (Capacitor.getPlatform() === "ios") {
      await Browser.close();
    }
  } catch (e) {
    console.info("Browser was not open or could not be closed.", e);
  }
}
