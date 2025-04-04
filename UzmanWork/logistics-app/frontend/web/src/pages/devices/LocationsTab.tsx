import { useNvrs } from "utils/globals";
import { LocationTabView } from "components/devices/LocationTabView";
import { LoadingBox } from "components/video/LoadingBox";
import { REFETCH_INTERVAL } from "components/devices/utils";
import { isDefined } from "utils/types";
import { useLocations } from "coram-common-utils";

export function LocationsTab() {
  const { data: locations, isFetched: locationsFetched } = useLocations();
  const { data: nvrs, isFetched: nvrsFetched } = useNvrs({
    refetchInterval: REFETCH_INTERVAL,
  });

  const nvrAssignedLocationIds = nvrs
    .map((nvr) => nvr.location_id)
    .filter(isDefined);
  const isFetched = locationsFetched && nvrsFetched;

  return (
    <>
      {isFetched ? (
        <LocationTabView
          locations={Array.from(locations.values())}
          nvrAssignedLocationIds={nvrAssignedLocationIds}
          nvrs={nvrs}
        />
      ) : (
        <LoadingBox />
      )}
    </>
  );
}
