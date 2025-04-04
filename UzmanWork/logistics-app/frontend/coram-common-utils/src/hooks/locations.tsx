import { useQuery } from "react-query";
import { DefaultService, Location } from "../backend_client";
import { LOCATIONS_QUERY_KEY } from "../constants";

const EMPTY_LOCATIONS = new Map<number, Location>();

export function useLocations(refetchOnWindowFocus = true) {
  const query = useQuery(
    [LOCATIONS_QUERY_KEY],
    async () => {
      const locations = await DefaultService.locations();
      return new Map<number, Location>(
        locations.map((location) => {
          return [location.id, location];
        })
      );
    },
    {
      refetchOnWindowFocus: refetchOnWindowFocus,
    }
  );
  return {
    ...query,
    data: query.data ?? EMPTY_LOCATIONS,
  };
}
