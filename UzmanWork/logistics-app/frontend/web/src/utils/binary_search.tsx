import binarySearch from "binary-search";

export function findClosestIndex(values: number[], value: number): number {
  const lessComparison = (a: number, b: number) => a - b;
  const idx = binarySearch(values, value, lessComparison);

  // Based on the binary search library, if the index is negative, it means
  // that the index is the negative of the index where the element should be
  // inserted. We want to return the index of the element before that.
  if (idx < 0) {
    return Math.min(-idx - 1, values.length - 1);
  } else {
    // If the index is positive, it means that the element was found.
    return idx;
  }
}
