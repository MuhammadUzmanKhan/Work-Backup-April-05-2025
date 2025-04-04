import { useState, useRef, useEffect } from "react";

const DEFAULT_SCROLL_SETTINGS: IntersectionObserverInit = {
  // intersect with the viewport
  root: null,
  // expand each side of the viewport by 50px
  rootMargin: "0px 0px 50px 0px",
  // intersect when 0% of the target is visible
  threshold: 0,
};

// Setup an IntersectionObserver
function setupObserver(
  setPage: React.Dispatch<React.SetStateAction<number>>,
  observerRef: React.MutableRefObject<IntersectionObserver | null>,
  settings: IntersectionObserverInit
) {
  observerRef.current = new IntersectionObserver((entries) => {
    // Wew are assuming that there is only one element being observed.
    entries.forEach((entry: IntersectionObserverEntry) => {
      if (entry.isIntersecting) {
        setPage((prev) => prev + 1);
      }
    });
  }, settings);
  return observerRef.current;
}

// Remove the observer from observing the element.
function removeObserver(
  observerRef: React.MutableRefObject<ResizeObserver | null>
) {
  observerRef.current?.disconnect();
  observerRef.current = null;
}

// Increment the page number when the element is intersected with the viewport.
export function useElementIntersection(settings = DEFAULT_SCROLL_SETTINGS) {
  const [ref, setRef] = useState<HTMLElement | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!ref || observerRef.current) {
      return;
    }
    const observer = setupObserver(setPage, observerRef, settings);
    observer.observe(ref);
    return () => removeObserver(observerRef);
  }, [ref, settings]);
  return { page, setRef };
}
