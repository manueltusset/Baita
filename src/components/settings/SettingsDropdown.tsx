import { useSettingsStore, type PanelPreset } from "@/stores/settingsStore";
import { THEMES } from "@/lib/themes";
import RetentionSlider from "./RetentionSlider";

export default function SettingsDropdown() {
  const {
    theme, outputDays, commandDays, sessionDays, maxDbMb, dbUsedMb,
    defaultLayout,
    setTheme, setOutputDays, setCommandDays, setSessionDays, setMaxDbMb,
    setDefaultLayout,
  } = useSettingsStore();

  const usedPct = maxDbMb > 0 ? Math.round((dbUsedMb / maxDbMb) * 100) : 0;

  return (
    <>
      {/* Header */}
      <div style={{
        fontSize: "var(--font-size-sm)",
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        color: "var(--color-text)",
        marginBottom: 14,
      }}>
        Settings
      </div>

      {/* Theme picker */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        marginBottom: 14,
        maxHeight: 160,
        overflowY: "auto",
        paddingRight: 2,
      }}>
        {THEMES.map((t) => {
          const isActive = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: "var(--radius-md)",
                border: `1.5px solid ${isActive ? t.preview.accent : "var(--color-border)"}`,
                background: isActive ? "var(--color-accent-dim)" : "var(--color-surface)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {/* Swatch */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: "var(--radius-sm)",
                background: t.preview.bg,
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: t.preview.accent,
                }} />
              </div>
              {/* Nome */}
              <span style={{
                fontSize: "10px",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                color: isActive ? "var(--color-text)" : "var(--color-text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "left",
              }}>
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Retention */}
      <div style={{
        fontSize: "9px",
        fontWeight: 700,
        color: "var(--color-text-muted)",
        letterSpacing: "0.08em",
        fontFamily: "var(--font-display)",
        marginBottom: 8,
      }}>
        RETENTION
      </div>

      <RetentionSlider label="Full output" value={outputDays} min={1} max={30} unit="days" color="var(--color-accent)" onChange={setOutputDays} />
      <RetentionSlider label="Commands metadata" value={commandDays} min={7} max={365} unit="days" color="var(--color-info)" onChange={setCommandDays} />
      <RetentionSlider label="Old sessions" value={sessionDays} min={7} max={180} unit="days" color="var(--color-accent-light)" onChange={setSessionDays} />
      <RetentionSlider label="Max database size" value={maxDbMb} min={100} max={2000} unit="MB" color="var(--color-warning)" onChange={setMaxDbMb} />

      {/* Default layout */}
      <div style={{
        fontSize: "9px",
        fontWeight: 700,
        color: "var(--color-text-muted)",
        letterSpacing: "0.08em",
        fontFamily: "var(--font-display)",
        marginBottom: 8,
      }}>
        DEFAULT LAYOUT
      </div>

      <div style={{
        borderRadius: "var(--radius-lg)",
        padding: "10px 12px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        marginBottom: 14,
      }}>
        {/* Panel count */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}>
          <span style={{
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-display)",
          }}>
            Panels
          </span>
          <div style={{ display: "flex", gap: 3 }}>
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => {
                  const panels: PanelPreset[] = Array.from(
                    { length: n },
                    (_, i) => defaultLayout.panels[i] ?? {},
                  );
                  setDefaultLayout({ ...defaultLayout, panels });
                }}
                style={{
                  padding: "3px 8px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${defaultLayout.panels.length === n ? "var(--color-accent-border)" : "transparent"}`,
                  background: defaultLayout.panels.length === n ? "var(--color-accent-dim)" : "transparent",
                  color: defaultLayout.panels.length === n ? "var(--color-accent-light)" : "var(--color-text-muted)",
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Split direction */}
        {defaultLayout.panels.length > 1 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}>
            <span style={{
              fontSize: "11px",
              color: "var(--color-text-secondary)",
              fontFamily: "var(--font-display)",
            }}>
              Split
            </span>
            <div style={{ display: "flex", gap: 3 }}>
              {(["horizontal", "vertical"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDefaultLayout({ ...defaultLayout, splitDirection: d })}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${defaultLayout.splitDirection === d ? "var(--color-accent-border)" : "transparent"}`,
                    background: defaultLayout.splitDirection === d ? "var(--color-accent-dim)" : "transparent",
                    color: defaultLayout.splitDirection === d ? "var(--color-accent-light)" : "var(--color-text-muted)",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                    textTransform: "capitalize",
                  }}
                >
                  {d === "horizontal" ? "H" : "V"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {defaultLayout.panels.length > 1 && (
          <div style={{
            display: "flex",
            flexDirection: defaultLayout.splitDirection === "horizontal" ? "row" : "column",
            gap: 2,
            height: 32,
            marginBottom: 8,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
          }}>
            {defaultLayout.panels.map((_, i) => (
              <div key={i} style={{
                flex: 1,
                background: "var(--color-accent-dim)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent-light)",
                fontWeight: 600,
              }}>
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Commands per panel */}
        {defaultLayout.panels.map((preset, i) => (
          <div key={i} style={{ marginBottom: i < defaultLayout.panels.length - 1 ? 4 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{
                fontSize: "9px",
                color: "var(--color-text-faint)",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                minWidth: 12,
              }}>
                {i + 1}
              </span>
              <input
                value={preset.command || ""}
                onChange={(e) => {
                  const panels = [...defaultLayout.panels];
                  panels[i] = { ...panels[i], command: e.target.value || undefined };
                  setDefaultLayout({ ...defaultLayout, panels });
                }}
                placeholder="command (optional)"
                style={{
                  flex: 1,
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "3px 6px",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* DB status */}
      <div style={{
        borderRadius: "var(--radius-lg)",
        padding: "10px 12px",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}>
          <span style={{
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-display)",
          }}>
            Database
          </span>
          <span style={{
            fontSize: "11px",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}>
            {dbUsedMb} / {maxDbMb} MB
          </span>
        </div>
        <div style={{
          height: 2,
          borderRadius: 1,
          background: "var(--color-surface-hover)",
        }}>
          <div style={{
            height: "100%",
            borderRadius: 1,
            width: `${usedPct}%`,
            background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>
    </>
  );
}
