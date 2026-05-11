import { useCallback, useEffect, useState } from 'react';

/**
 * Syncs a single URL search parameter with React state.
 *
 * - Reads the initial value from `window.location.search` on mount.
 * - Validates against `allowedValues`; falls back to `defaultValue` if the
 *   param is missing or not in the allowed set.
 * - Writes via `history.pushState` so the browser back button works.
 * - Listens to `popstate` so navigating back/forward updates the state.
 *
 * @example
 * const [tab, setTab] = useSearchParamState('tab', 'inventory', ADMIN_VIEWS);
 * // URL: /admin.html?tab=bopis  →  tab === 'bopis'
 */
export function useSearchParamState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[],
): [T, (next: T) => void] {
  const readFromUrl = useCallback((): T => {
    const raw = new URLSearchParams(window.location.search).get(key);
    if (raw && (allowedValues as readonly string[]).includes(raw)) {
      return raw as T;
    }
    return defaultValue;
  }, [key, defaultValue, allowedValues]);

  const [value, setValue] = useState<T>(readFromUrl);

  // Keep state in sync when the user presses back/forward.
  useEffect(() => {
    const onPopState = () => setValue(readFromUrl());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [readFromUrl]);

  const setValueAndUrl = useCallback(
    (next: T) => {
      const url = new URL(window.location.href);
      url.searchParams.set(key, next);
      window.history.pushState({}, '', url.toString());
      setValue(next);
    },
    [key],
  );

  return [value, setValueAndUrl];
}
