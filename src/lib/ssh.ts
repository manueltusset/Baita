import type { SSHProfile } from "./types";

export function getSSHShellConfig(profile: SSHProfile): { shell: string; shellArgs: string[] } {
  const args = ["-t"];
  if (profile.port !== 22) args.push("-p", String(profile.port));
  if (profile.authMethod === "key" && profile.keyPath) args.push("-i", profile.keyPath);
  args.push(`${profile.username}@${profile.host}`);
  return { shell: "ssh", shellArgs: args };
}
