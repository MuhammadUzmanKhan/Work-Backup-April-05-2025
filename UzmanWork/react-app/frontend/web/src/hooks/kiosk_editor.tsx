import { useQuery } from "react-query";
import { KioskService } from "coram-common-utils";

// Fetch the user's kiosks
export function useKiosks() {
  return useQuery(
    ["kiosks"],
    async () => {
      return await KioskService.retrieveKiosks();
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}
