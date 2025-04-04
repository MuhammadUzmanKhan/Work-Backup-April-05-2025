import {
  DirectionsCarOutlined as DirectionsCarOutlinedIcon,
  PersonOutlineOutlined as PersonOutlineOutlinedIcon,
} from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Stack } from "@mui/material";
import { DetectionObjectTypeCategory } from "coram-common-utils";
import { Dispatch, SetStateAction } from "react";

interface ObjectTypeSelectorProps {
  readonly?: boolean;
  aggregatedObjectTypes: Set<DetectionObjectTypeCategory>;
  setAggregatedObjectTypes?: Dispatch<
    SetStateAction<Set<DetectionObjectTypeCategory>>
  >;
  iconColors: (selected: boolean) => SxProps;
}

export function ObjectTypeSelector({
  readonly,
  aggregatedObjectTypes,
  setAggregatedObjectTypes,
  iconColors,
}: ObjectTypeSelectorProps) {
  const iconsStyles = {
    borderRadius: "5px",
    fontSize: "27px",
    padding: "4px",
    marginRight: "5px",
    marginY: "5px",
    cursor: readonly ? "not-allowed" : "pointer",
  };

  function flipPresence(aggregatedType: DetectionObjectTypeCategory) {
    if (setAggregatedObjectTypes === undefined) return;
    if (aggregatedObjectTypes.has(aggregatedType)) {
      setAggregatedObjectTypes(
        new Set(
          [...aggregatedObjectTypes].filter((type) => type !== aggregatedType)
        )
      );
    } else {
      setAggregatedObjectTypes(
        new Set([...aggregatedObjectTypes, aggregatedType])
      );
    }
  }

  return (
    <Stack direction="row" alignItems="center" columnGap="0.8rem">
      <PersonOutlineOutlinedIcon
        sx={{
          ...iconColors(
            aggregatedObjectTypes.has(DetectionObjectTypeCategory.PERSON)
          ),
          ...iconsStyles,
        }}
        onClick={() => {
          if (!readonly) flipPresence(DetectionObjectTypeCategory.PERSON);
        }}
      />
      <DirectionsCarOutlinedIcon
        sx={{
          ...iconColors(
            aggregatedObjectTypes.has(DetectionObjectTypeCategory.VEHICLE)
          ),
          ...iconsStyles,
        }}
        onClick={() => {
          if (!readonly) flipPresence(DetectionObjectTypeCategory.VEHICLE);
        }}
      />
    </Stack>
  );
}
