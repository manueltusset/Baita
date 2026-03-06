import type { SSHProfile } from "./types";

export function getSSHShellConfig(profile: SSHProfile): { shell: string; shellArgs: string[] } {
  const args = ["-t"];
  if (profile.port !== 22) args.push("-p", String(profile.port));
  if (profile.authMethod === "key" && profile.keyPath) args.push("-i", profile.keyPath);
  args.push(`${profile.username}@${profile.host}`);

  // Injetar OSC 7 prompt hooks no shell remoto para CWD tracking
  // PROMPT_COMMAND para bash, ZDOTDIR trick nao necessario — bash cobre maioria dos servidores
  args.push(
    `export PROMPT_COMMAND='printf "\\033]7;file://$(hostname)$PWD\\007"'; exec $SHELL -l`,
  );

  return { shell: "ssh", shellArgs: args };
}
