import { RefObject, useEffect, useRef, useState } from "react";

export function useVisibilityChange<T extends Element>(
  callback: (isVisible: boolean) => void
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        callbackRef.current(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 1.0,
      }
    );

    const currentElement = ref.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [ref]);

  return [ref, isVisible];
}
