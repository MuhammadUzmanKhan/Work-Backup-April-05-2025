import Muuri from "muuri";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { MuuriGridContext, MuuriGridContextValue } from "./MuuriGridContext";
import { MUURI_GRID_ITEM_CLASS } from "./consts";
import { useElementSize } from "hooks/element_size";
import { isDefined } from "coram-common-utils";
import { createPortal } from "react-dom";

export interface MuuriGridProps {
  onItemsReordered?: (newOrder: string[]) => void;
  children: ReactNode;
}

export function MuuriGrid({ onItemsReordered, children }: MuuriGridProps) {
  const [muuriContext, setMuuriContext] = useState<
    undefined | MuuriGridContextValue
  >();

  const { size, setRef, ref: muuriContainer } = useElementSize();
  const dragContainerRef = useRef<HTMLDivElement>();
  const gridScrollerRef = useRef<HTMLDivElement>();

  const onItemsReorderedRef = useRef(onItemsReordered);
  onItemsReorderedRef.current = onItemsReordered;

  useEffect(() => {
    if (!isDefined(muuriContainer)) {
      return;
    }

    const muuri = new Muuri(muuriContainer, {
      items: `.${MUURI_GRID_ITEM_CLASS}`,
      layoutOnResize: true,
      layout: { fillGaps: true },
      dragEnabled: true,
      dragContainer: dragContainerRef.current,
      dragRelease: {
        useDragContainer: false,
      },
      dragPlaceholder: {
        enabled: true,
        createElement: function (item) {
          const element = item.getElement();
          const placeholder = element?.cloneNode(true);
          return placeholder as HTMLElement;
        },
      },
      dragAutoScroll: {
        targets: [
          {
            element: gridScrollerRef.current ?? window,
            axis: Muuri.AutoScroller.AXIS_Y,
          },
        ],
        sortDuringScroll: false,
      },
      dragStartPredicate: {
        delay: 200,
      },
      layoutDuration: 200,
      layoutEasing: "ease",
    });

    function reorderCb() {
      if (!isDefined(muuri)) {
        return;
      }

      const itemOrder = muuri
        .getItems()
        .map((item) => item.getElement()?.getAttribute("data-id"))
        .filter(isDefined);

      onItemsReorderedRef.current?.(itemOrder);
    }

    muuri.on("move", reorderCb);
    muuri.layout();

    setMuuriContext({
      parentSize: { width: 0, height: 0 },
      addGridItem: (item) => muuri.add(item),
      removeGridItems: (items) => muuri.remove(items),
      updateLayout: () => {
        muuri.refreshItems();
        muuri.layout();
      },
    });

    return () => {
      muuri.off("move", reorderCb);
      muuri.destroy();
    };
  }, [muuriContainer]);

  return (
    <>
      {/* https://docs.muuri.dev/grid-options.html#dragautoscroll */}
      {createPortal(
        <Box
          position="fixed"
          left={0}
          top={0}
          zIndex={999}
          ref={dragContainerRef}
        />,
        document.body
      )}
      <Box
        position="relative"
        overflow="hidden"
        sx={{ overflowY: "scroll" }}
        pr={1}
        ref={gridScrollerRef}
      >
        <Box position="relative" minHeight="100%" ref={setRef}>
          {muuriContext && (
            <MuuriGridContext.Provider
              value={{ ...muuriContext, parentSize: size }}
            >
              {children}
            </MuuriGridContext.Provider>
          )}
        </Box>
      </Box>
    </>
  );
}
