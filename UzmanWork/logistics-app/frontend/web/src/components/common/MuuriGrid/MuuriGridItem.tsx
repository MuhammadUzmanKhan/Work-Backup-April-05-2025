import { ReactNode, useContext, useEffect } from "react";
import { Box, type SxProps } from "@mui/material";
import { MuuriGridContext } from "./MuuriGridContext";
import { MUURI_GRID_ITEM_CLASS } from "./consts";
import { useElementSize } from "hooks/element_size";
import { isDefined } from "coram-common-utils";
import { useIsMobile } from "../../layout/MobileOnly";

export type MuuriGridItemWidth = "half" | "full";

export interface MuuriGridItemProps {
  id: string;
  width: MuuriGridItemWidth;
  sx?: Omit<SxProps, "width">;
  children: ReactNode;
}

export function MuuriGridItem({ id, width, sx, children }: MuuriGridItemProps) {
  const isMobile = useIsMobile();

  const { parentSize, addGridItem, removeGridItems, updateLayout } =
    useContext(MuuriGridContext);

  const { size, setRef, ref } = useElementSize();

  useEffect(() => {
    updateLayout();
  }, [size, updateLayout]);

  useEffect(() => {
    if (!isDefined(ref)) {
      return;
    }

    const muuriItems = addGridItem(ref);
    updateLayout();

    return () => {
      if (muuriItems) removeGridItems(muuriItems);
    };
  }, [ref, addGridItem, removeGridItems, updateLayout]);

  const gridItemWidth =
    isMobile || width === "full" ? parentSize.width : parentSize.width / 2;

  return (
    <Box
      className={MUURI_GRID_ITEM_CLASS}
      position="absolute"
      width={`${gridItemWidth}px`}
      sx={(theme) => ({
        ...sx,
        cursor: "grab",
        zIndex: 1,
        "&.muuri-item-dragging": {
          cursor: "grabbing",
          zIndex: 2,
          opacity: 0.65,
        },
        "&.muuri-item-placeholder": {
          border: `1px dashed ${theme.palette.primary.main}`,
          borderRadius: "1rem",
        },
      })}
      data-id={id}
      ref={setRef}
    >
      {children}
    </Box>
  );
}
