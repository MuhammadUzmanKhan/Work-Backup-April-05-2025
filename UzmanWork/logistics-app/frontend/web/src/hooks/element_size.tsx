import { useRef, useLayoutEffect, useState, useEffect } from "react";

export interface ElementSize {
  height: number;
  width: number;
}

const DEFAULT_SIZE: ElementSize = {
  height: 0,
  width: 0,
};

export interface ElementSizeWithOffset extends ElementSize {
  offsetLeft: number;
  offsetTop: number;
}

const DEFAULT_SIZE_WITH_OFFSET: ElementSizeWithOffset = {
  ...DEFAULT_SIZE,
  offsetLeft: 0,
  offsetTop: 0,
};

// Setup a ResizeObserver to observe the size of an element.
export function setupObserver(
  setSize: (size: ElementSize) => void,
  observerRef: React.MutableRefObject<ResizeObserver | null>
) {
  // see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
  observerRef.current = new ResizeObserver((entries) => {
    // Wew are assuming that there is only one element being observed.
    entries.forEach(
      ({ contentRect: { height, width } }: ResizeObserverEntry) => {
        setSize({
          height,
          width,
        });
      }
    );
  });
  return observerRef.current;
}

// Remove the observer from observing the element.
export function removeObserver(
  observerRef: React.MutableRefObject<ResizeObserver | null>
) {
  observerRef.current?.disconnect();
  observerRef.current = null;
}

// Compute the size of an element and update it when it changes.
export function useElementSizeFromEl(element: HTMLElement | null) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState<ElementSize>(DEFAULT_SIZE);

  useLayoutEffect(() => {
    if (!element || observerRef.current) {
      return;
    }
    const observer = setupObserver(setSize, observerRef);
    observer.observe(element);
    return () => removeObserver(observerRef);
  }, [element]);
  return { size };
}

// Compute the size of an element and update it when it changes.
// Return a setter to set the ref to the element.
// This way we can track changes to the ref and update the observer.
export function useElementSize() {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const { size } = useElementSizeFromEl(ref);
  return { size, setRef, ref };
}

// Compute the size and offset of a target inside a container
// Track changes in the container too, to ensure the offset is always correct.
export function useElementSizeAndOffset(
  targetElement: HTMLElement | null,
  containerElement: HTMLElement | null
) {
  const { size: targetSize } = useElementSizeFromEl(targetElement);
  const { size: containerSize } = useElementSizeFromEl(containerElement);
  const [size, setSize] = useState<ElementSizeWithOffset>(
    DEFAULT_SIZE_WITH_OFFSET
  );

  // If target or container changes, update the size and offset.
  useEffect(() => {
    if (targetElement === null) {
      return;
    }
    const offsetLeft = targetElement.offsetLeft;
    const offsetTop = targetElement.offsetTop;
    setSize({
      ...targetSize,
      offsetLeft,
      offsetTop,
    });
  }, [targetSize, containerSize, targetElement]);

  return { size };
}
