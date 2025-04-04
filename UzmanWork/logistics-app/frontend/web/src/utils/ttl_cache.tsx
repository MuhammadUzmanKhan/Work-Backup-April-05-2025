import { DateTime, Duration } from "luxon";
import { useCallback, useRef } from "react";
import { isDefined } from "./types";

export function useTTLCache<K, V>(ttl: Duration) {
  const cache = useRef<Map<K, { data: V; expiry: DateTime }>>(new Map());
  const ttlRef = useRef(ttl);
  ttlRef.current = ttl;

  const get = useCallback((key: K) => {
    const entry = cache.current.get(key);
    if (!isDefined(entry) || entry.expiry < DateTime.now()) {
      return undefined;
    }
    return entry.data;
  }, []);

  const set = useCallback((key: K, value: V) => {
    cache.current.set(key, {
      data: value,
      expiry: DateTime.now().plus(ttlRef.current),
    });
  }, []);

  const remove = useCallback((key: K) => {
    cache.current.delete(key);
  }, []);

  return {
    cache: {
      get,
      set,
      remove,
    },
  };
}
