import { AccessPointEventResponse } from "features/accessControl/types";

export function getEventId(event: AccessPointEventResponse) {
  return `${event.access_point_id}_${event.time}_${event.result}_${
    event.actor ?? ""
  }`;
}

export function getClipLookupId(eventId: string, cameraMacAddress: string) {
  return `${eventId}_${cameraMacAddress}`;
}

export function filterAccessControlEventsBySearchQuery(
  accessPointEvents: AccessPointEventResponse[],
  searchQuery: string
) {
  if (searchQuery === "") return accessPointEvents;

  const query = searchQuery.toLowerCase();

  return accessPointEvents.filter(
    (event) =>
      (event.description && event.description.toLowerCase().includes(query)) ||
      (event.actor && event.actor.toLowerCase().includes(query))
  );
}
