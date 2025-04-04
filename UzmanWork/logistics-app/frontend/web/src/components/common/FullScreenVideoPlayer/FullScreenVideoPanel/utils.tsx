import type { HtmlPortalNode } from "react-reverse-portal";

export function findNextValidVideoId(
  portalNodes: Map<number, HtmlPortalNode>,
  currentId: number,
  direction: "next" | "previous"
) {
  const keys = Array.from(portalNodes.keys());
  let currentIndex = keys.indexOf(currentId);
  const maxIterations = keys.length;

  for (let i = 0; i < maxIterations; i++) {
    const directionValue = direction === "next" ? 1 : -1;
    currentIndex = (currentIndex + directionValue + keys.length) % keys.length;
    const nextId = keys[currentIndex];
    if (portalNodes.has(nextId)) {
      return nextId;
    }
  }
  return undefined;
}
