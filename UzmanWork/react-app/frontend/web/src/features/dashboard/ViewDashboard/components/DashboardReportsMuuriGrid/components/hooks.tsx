import { useEffect, useRef, useState } from "react";

const SCROLL_DELAY = 300;
const SCROLL_ANIMATION_DURATION = 3000;

export function useScrollToReportOnRequest(
  scrolledRequested: boolean,
  onScrollEnd: VoidFunction
) {
  const cardRef = useRef<HTMLDivElement>(null);

  const [isScrollInProgress, setIsScrollInProgress] = useState(false);

  const onScrollEndRef = useRef(onScrollEnd);
  onScrollEndRef.current = onScrollEnd;

  useEffect(() => {
    if (!scrolledRequested) {
      return;
    }

    // Required as it may take some time for the card to be rendered and moved
    // to the correct position.
    const scrollTimeout = setTimeout(() => {
      setIsScrollInProgress(true);
      cardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, SCROLL_DELAY);

    const flagResetTimeout = setTimeout(() => {
      onScrollEndRef.current();
      setIsScrollInProgress(false);
    }, SCROLL_ANIMATION_DURATION);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(flagResetTimeout);
    };
  }, [scrolledRequested]);

  return { cardRef, isScrollInProgress };
}
