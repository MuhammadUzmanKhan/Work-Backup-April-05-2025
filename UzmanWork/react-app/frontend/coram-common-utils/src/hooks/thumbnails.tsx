import { useQuery } from "react-query";
import { ThumbnailResponse, ThumbnailService } from "../backend_client";
import { useEffect, useState } from "react";

const EMPTY_MOST_RECENT_THUMBNAIL_ENLARGED = new Map<
  string,
  ThumbnailResponse
>();

export function useMostRecentThumbnailsEnlarged({
  camera_mac_addresses,
  enabled,
}: {
  camera_mac_addresses: string[];
  enabled: boolean;
}) {
  const queryResult = useQuery(
    ["most_recent_thumbnail_enlarged", camera_mac_addresses],
    async () => {
      const thumbnails =
        await ThumbnailService.retrieveMostRecentThumbnailEnlarged(
          camera_mac_addresses
        );
      return new Map<string, ThumbnailResponse>(Object.entries(thumbnails));
    },
    { enabled: enabled }
  );

  return {
    ...queryResult,
    data: queryResult.data ?? EMPTY_MOST_RECENT_THUMBNAIL_ENLARGED,
  };
}

// Retrieve the thumbnail and get a local URL to it
export function useFetchMostRecentThumbnailEnlarged({
  cameraMacAddress,
}: {
  cameraMacAddress: string;
}) {
  const { data: thumbnailURLData } = useMostRecentThumbnailsEnlarged({
    camera_mac_addresses: [cameraMacAddress],
    enabled: true,
  });
  const [thumbnailLocalURL, setThumbnailLocalURL] = useState<string>();

  useEffect(() => {
    const thumbnailURL = thumbnailURLData.get(cameraMacAddress);
    if (!thumbnailURL || !thumbnailURL.s3_signed_url) {
      return;
    }
    // Actively fetch the thumbnail from S3 and get a local url to it
    fetch(thumbnailURL.s3_signed_url).then((response) => {
      if (!response.ok) {
        return;
      }
      response.blob().then((blob) => {
        setThumbnailLocalURL(URL.createObjectURL(blob));
      });
    });

    return () => {
      setThumbnailLocalURL((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return undefined;
      });
    };
  }, [thumbnailURLData, cameraMacAddress]);

  return thumbnailLocalURL;
}
