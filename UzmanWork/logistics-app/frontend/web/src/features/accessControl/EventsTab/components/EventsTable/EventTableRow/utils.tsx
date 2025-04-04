export function getEventResultDisplayValue(eventResult: string) {
  switch (eventResult.toLowerCase()) {
    case "administrator pulse output":
      return "Remote Unlock";
    default:
      return eventResult;
  }
}
