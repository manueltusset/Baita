import { useState, useCallback } from "react";
import { useTauriEvent } from "./useTauriEvent";

interface CwdChangedPayload {
  tab_id: string;
  cwd: string;
}

// Hook that listens to CWD changes to update the file explorer
export function useFileTree() {
  const [currentCwd, setCurrentCwd] = useState<string>("~");

  const handleCwdChanged = useCallback((payload: CwdChangedPayload) => {
    setCurrentCwd(payload.cwd);
  }, []);

  useTauriEvent<CwdChangedPayload>("cwd_changed", handleCwdChanged);

  return { currentCwd };
}
