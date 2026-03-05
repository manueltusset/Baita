import { useState, useEffect } from "react";
import { gitStatus, sshExec } from "@/lib/tauri";
import type { SSHProfile } from "@/lib/types";

interface GitInfo {
  branch: string;
  isDirty: boolean;
  changedCount: number;
}

export function useGitStatus(cwd: string, sshProfile?: SSHProfile | null) {
  const [gitInfo, setGitInfo] = useState<GitInfo | null>(null);

  useEffect(() => {
    if (!cwd || cwd === "~") return;

    const fetchStatus = async () => {
      try {
        if (sshProfile) {
          const output = await sshExec(sshProfile, `git -C "${cwd}" status --porcelain -b 2>/dev/null`);
          const lines = output.split("\n").filter(Boolean);
          let branch = "HEAD";
          let changedCount = 0;

          for (const line of lines) {
            if (line.startsWith("## ")) {
              branch = line.slice(3).split("...")[0];
            } else {
              changedCount++;
            }
          }

          setGitInfo({
            branch,
            isDirty: changedCount > 0,
            changedCount,
          });
        } else {
          const result = await gitStatus(cwd);
          setGitInfo({
            branch: result.branch,
            isDirty: result.is_dirty,
            changedCount:
              result.staged.length + result.unstaged.length + result.untracked.length,
          });
        }
      } catch {
        setGitInfo(null);
      }
    };

    fetchStatus();
  }, [cwd, sshProfile]);

  return gitInfo;
}
