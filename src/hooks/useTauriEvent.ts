import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";

export function useTauriEvent<T>(
  event: string,
  callback: (payload: T) => void,
) {
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;
    let cancelled = false;

    listen<T>(event, (e) => callback(e.payload))
      .then((fn) => {
        if (cancelled) fn();
        else unlistenFn = fn;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, [event, callback]);
}
