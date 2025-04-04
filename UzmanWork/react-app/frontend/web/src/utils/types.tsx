export function isDefined<T>(val: T | undefined | null): val is T {
  // This checks for both null and undefined
  return val !== undefined && val !== null;
}
