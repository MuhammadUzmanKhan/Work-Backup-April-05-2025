import { useEffect, useMemo, useState } from "react";
import {
  AccessPointEventCameraInfo,
  AccessPointEventResponse,
  AccessPointResponse,
  AugumentedAccessPointEventResponse,
  parseAccessPointEvent,
} from "features/accessControl/types";
import {
  AccessControlService,
  CameraResponse,
  isDefined,
  useCamerasList,
  DEFAULT_TIMEZONE,
} from "coram-common-utils";
import { formatDateTime } from "utils/dates";
import {
  filterAccessControlEventsBySearchQuery,
  getClipLookupId,
  getEventId,
} from "./utils";
import { augmentClipsWithThumbnails } from "utils/thumbnails";
import { ClipData } from "components/timeline/ClipsGrid";
import { useAccessControlPoints } from "features/accessControl/hooks";
import { useQuery } from "react-query";
import { Sortable, sortData } from "utils/sortable";
import { TimeInterval } from "utils/time";
import { PaginationData } from "components/devices/PaginationUtils";

export type AccessControlEventsSortKeys = "time" | "actor";

interface UseAccessControlEventsProps {
  searchQuery: string;
  timeInterval: TimeInterval;
  sortable: Sortable<AccessControlEventsSortKeys>;
  pagination: PaginationData;
}

export function useAccessControlEvents({
  searchQuery,
  timeInterval,
  sortable,
  pagination: { page, itemsPerPage },
}: UseAccessControlEventsProps) {
  const startTime = formatDateTime(timeInterval.timeStart);
  const endTime = formatDateTime(timeInterval.timeEnd);
  const query = useQuery(
    ["retrieve_access_control_events", `${startTime}:${endTime}`],
    async () => {
      const events = await AccessControlService.listEvents({
        start_time: startTime,
        end_time: endTime,
      });
      return events.map(parseAccessPointEvent);
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const sortedAndFilteredData = useMemo(() => {
    const sortedData = sortData<AccessPointEventResponse>(
      query.data ?? [],
      sortable.orderBy,
      sortable.order
    );
    return filterAccessControlEventsBySearchQuery(sortedData, searchQuery);
  }, [query.data, searchQuery, sortable.order, sortable.orderBy]);

  const pagedData = useMemo(() => {
    return sortedAndFilteredData.slice(
      page * itemsPerPage,
      (page + 1) * itemsPerPage
    );
  }, [sortedAndFilteredData, page, itemsPerPage]);

  return { ...query, data: pagedData, total: sortedAndFilteredData.length };
}

type UseAccessControlEventsWithCamerasProps = UseAccessControlEventsProps;

export function useAccessControlEventsWithCameras(
  props: UseAccessControlEventsWithCamerasProps
) {
  const { isLoading: isLoadingAccessControlPoints, data: accessControlPoints } =
    useAccessControlPoints();
  const accessPointsLookupMap = useMemo(
    () =>
      accessControlPoints.reduce((map, accessPoint) => {
        map.set(accessPoint.id, accessPoint);
        return map;
      }, new Map<string, AccessPointResponse>()),
    [accessControlPoints]
  );

  const {
    isLoading: isLoadingAccessPointControlEvents,
    data: accessPointControlEvents,
    total: totalNumberOfAccessPointControlEvents,
  } = useAccessControlEvents(props);

  const { isLoading: isLoadingCameras, data: cameras } = useCamerasList({});
  const camerasLookupMap = useMemo(
    () =>
      cameras.reduce((map, camera) => {
        map.set(camera.camera.mac_address, camera);
        return map;
      }, new Map<string, CameraResponse>()),
    [cameras]
  );

  const [events, setEvents] = useState<AugumentedAccessPointEventResponse[]>(
    []
  );

  const [isArgumeningtEvents, setIsArgumeningtEvents] = useState(false);

  const dataHasLoaded = !(
    isLoadingAccessControlPoints ||
    isLoadingAccessPointControlEvents ||
    isLoadingCameras
  );

  useEffect(() => {
    setIsArgumeningtEvents(true);

    if (!dataHasLoaded) {
      return;
    }

    async function augmentEvents() {
      try {
        const augmentedEvents: AugumentedAccessPointEventResponse[] =
          accessPointControlEvents.map((event) => {
            const accessPointId = event?.access_point_id;
            if (!accessPointId) {
              return {
                ...event,
                cameras: [],
              };
            }

            // Sometimes for Alta paylaod we don't have an associated
            // Access Point when an event has empty results. I don't know what it is.
            let cameras: AccessPointEventCameraInfo[] = [];
            const accessPoint = accessPointsLookupMap.get(accessPointId);
            if (accessPoint) {
              cameras = accessPoint.cameras.map((camera) => ({
                macAddress: camera.mac_address,
                isFavorite: camera.is_favorite,
                timezone:
                  camerasLookupMap.get(camera.mac_address)?.timezone ??
                  DEFAULT_TIMEZONE,
              }));
            }

            return {
              ...event,
              cameras,
            };
          });

        const clips = augmentedEvents.flatMap((event) =>
          event.cameras
            .map(({ macAddress }) => camerasLookupMap.get(macAddress))
            .filter(isDefined)
            .map((cameraResponse) => ({
              eventId: getEventId(event),
              startTime: event.time.minus({
                seconds: 5,
              }),
              endTime: event.time.plus({
                seconds: 10,
              }),
              camera: cameraResponse,
            }))
        );

        const augmentedClips = await augmentClipsWithThumbnails<
          ClipData & {
            eventId: string;
            camera: CameraResponse;
          }
        >(clips);

        const clipsLookup = augmentedClips.reduce(
          (result, clip) => {
            const lookupId = getClipLookupId(
              clip.eventId,
              clip.camera.camera.mac_address
            );
            result.set(lookupId, clip);
            return result;
          },
          new Map<
            string,
            ClipData & {
              eventId: string;
              camera: CameraResponse;
            }
          >()
        );

        augmentedEvents.forEach((event) => {
          event.cameras.forEach((camera) => {
            const lookupId = getClipLookupId(
              getEventId(event),
              camera.macAddress
            );
            camera.clip = clipsLookup.get(lookupId);
          });
        });

        setEvents(augmentedEvents);
      } finally {
        setIsArgumeningtEvents(false);
      }
    }

    augmentEvents();
  }, [
    dataHasLoaded,
    accessPointControlEvents,
    accessPointsLookupMap,
    camerasLookupMap,
  ]);

  const isLoading = !dataHasLoaded || isArgumeningtEvents;

  return {
    isLoading,
    events,
    total: totalNumberOfAccessPointControlEvents,
  };
}
