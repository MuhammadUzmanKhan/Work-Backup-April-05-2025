import { DateTime, Duration } from "luxon";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { isDefined } from "coram-common-utils";

const MAX_DOWNLOAD_DURATION = Duration.fromObject({
  second: 5,
});

// hook to determine whether an image has been fully loaded by the dom or if an error occurred.
export function useImageLoadStatus(
  macAddress: string,
  imageUrl: string | undefined
) {
  const query = useQuery(
    ["imageLoadStatus", macAddress],
    async () => {
      if (!isDefined(imageUrl)) {
        return;
      }
      let status = "loading";
      const handleLoad = () => {
        status = "loaded";
      };
      const handleError = () => {
        status = "error";
      };

      const img = new Image();
      img.src = imageUrl;
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);

      // wait for up to 5 seconds for the image to load
      const startTime = DateTime.now();
      let intervalHandle = undefined;
      await new Promise<void>((resolve) => {
        intervalHandle = setInterval(() => {
          const expired =
            DateTime.now().diff(startTime) > MAX_DOWNLOAD_DURATION;
          if (status === "loaded" || status === "error" || expired) {
            resolve();
          }
        }, 250);
      });
      // cleanup event listeners
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
      clearInterval(intervalHandle);
      if (status !== "loaded") {
        // NOTE(@lberg): doesn't really matter what we throw,
        // it's just to set the status in react-query
        throw new Error("Image failed to load");
      }
      return imageUrl;
    },
    {
      enabled: isDefined(imageUrl),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    }
  );
  // NOTE(@lberg): we do this because we want to "refetch" the query when the imageUrl changes
  // but we don't want it to be a different query key
  const refetch = query.refetch;
  useEffect(() => {
    refetch();
  }, [imageUrl, refetch]);

  return query;
}
