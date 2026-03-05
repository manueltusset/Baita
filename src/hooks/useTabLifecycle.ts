import { useCallback } from "react";
import { useTauriEvent } from "./useTauriEvent";
import { useTerminalStore } from "@/stores/terminalStore";
import type { TabState } from "@/lib/types";

interface TabStatePayload {
  tab_id: string;
  state: string;
}

// Hook that listens to tab lifecycle events (hibernate/suspend/restore)
export function useTabLifecycle() {
  const { setTabState } = useTerminalStore();

  const handleTabState = useCallback((payload: TabStatePayload) => {
    setTabState(payload.tab_id, payload.state as TabState);
  }, [setTabState]);

  useTauriEvent<TabStatePayload>("tab_state", handleTabState);
}
