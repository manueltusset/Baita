import { useState, useEffect, useMemo } from "react";
import { sshExec } from "@/lib/tauri";
import type { SSHProfile } from "@/lib/types";

// Busca $HOME remoto e usa como fallback quando CWD local nao faz sentido
export function useRemoteCwd(
  localCwd: string | undefined,
  sshProfile: SSHProfile | null | undefined,
): string {
  const [remoteHome, setRemoteHome] = useState<string | null>(null);

  useEffect(() => {
    if (!sshProfile) {
      setRemoteHome(null);
      return;
    }
    sshExec(sshProfile, "echo $HOME")
      .then((h) => setRemoteHome(h.trim()))
      .catch(() => setRemoteHome(`/home/${sshProfile.username}`));
  }, [sshProfile]);

  return useMemo(() => {
    if (!sshProfile) return localCwd || "~";
    // CWD stale do tabCreate (local macOS path) — usar home remoto
    if (!localCwd || localCwd === "~" || localCwd.startsWith("/Users/")) {
      return remoteHome || `/home/${sshProfile.username}`;
    }
    return localCwd;
  }, [sshProfile, localCwd, remoteHome]);
}
