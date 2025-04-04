export function isDefined<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null;
}

export type NonEmptyArray<T> = [T, ...T[]];

export function isNonEmptyArray<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}
