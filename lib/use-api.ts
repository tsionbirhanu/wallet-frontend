"use client";

import { useCallback, useEffect, useState } from "react";
import { isApiError } from "./api";

type Source<T> = (signal: AbortSignal) => Promise<T>;

type State<T> =
  | { source: null; status: "idle" }
  | { source: Source<T>; status: "success"; data: T }
  | { source: Source<T>; status: "error"; error: unknown };

function isAborted(error: unknown): boolean {
  return isApiError(error) && error.code === "ABORTED";
}

/**
 * Runs a request whenever `source` changes, and cancels the in-flight one when
 * it does. `source` MUST be memoized by the caller (useCallback over the query
 * inputs) — its identity is what defines "a different request".
 *
 * Data from a previous source is kept while the next one loads, so a paginated
 * table can dim its existing rows instead of collapsing to a spinner.
 */
export function useApiResource<T>(source: Source<T>) {
  const [state, setState] = useState<State<T>>({ source: null, status: "idle" });
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Nothing is set synchronously here; "loading" is derived below from
    // whether the settled state belongs to the current source.
    void (async () => {
      try {
        const data = await source(controller.signal);
        if (!cancelled) setState({ source, status: "success", data });
      } catch (error) {
        if (!cancelled && !isAborted(error)) setState({ source, status: "error", error });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [source, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  const settled = state.source === source;

  return {
    /** Most recent successful payload; may be stale while a new one loads. */
    data: state.status === "success" ? state.data : null,
    /** Only surfaced once the failure belongs to the current request. */
    error: settled && state.status === "error" ? state.error : null,
    loading: !settled,
    reload,
  };
}

/** Debounces a rapidly changing value, e.g. a search box. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
