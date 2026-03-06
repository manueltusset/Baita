# Baita Terminal - Shell Integration (OSC 633 + OSC 7)
# Apenas para shells interativos
[[ ! -o interactive ]] 2>/dev/null && return 0
case "$-" in *i*) ;; *) return 0 ;; esac

# Desabilita session save do macOS (nao faz sentido em terminal embutido)
export SHELL_SESSIONS_DISABLE=1

if [ -n "$ZSH_VERSION" ]; then
  __baita_preexec() {
    printf '\033]633;E;%s\007\033]633;C\007' "$1"
  }
  __baita_precmd() {
    printf '\033]633;D;%s\007' "$?"
    printf '\033]7;file://%s%s\007' "$(hostname)" "$PWD"
  }
  precmd_functions+=(__baita_precmd)
  preexec_functions+=(__baita_preexec)
elif [ -n "$BASH_VERSION" ]; then
  __baita_precmd() {
    printf '\033]633;D;%s\007' "$?"
    printf '\033]7;file://%s%s\007' "$(hostname)" "$PWD"
  }
  trap 'printf "\033]633;E;%s\007\033]633;C\007" "$BASH_COMMAND"' DEBUG
  PROMPT_COMMAND="__baita_precmd${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
fi
