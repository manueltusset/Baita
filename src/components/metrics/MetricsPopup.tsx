import { useState, useMemo } from "react";
import { useMetricsStore, type MetricsDataPoint } from "@/stores/metricsStore";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

type TimeRange = "5m" | "15m" | "30m" | "1h";

const RANGE_MS: Record<TimeRange, number> = {
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "30m": 30 * 60_000,
  "1h": 60 * 60_000,
};

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MetricsPopup() {
  const [range, setRange] = useState<TimeRange>("5m");
  const {
    history, latestCpu, latestMemPct, latestDiskPct,
    memoryUsed, memoryTotal, swapUsed, swapTotal,
    cpuCount, diskUsed, diskTotal, uptime,
  } = useMetricsStore();

  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - RANGE_MS[range];
    return history.filter((p) => p.timestamp >= cutoff);
  }, [history, range]);

  return (
    <>
      {/* Header + time range */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: "var(--font-size-sm)",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--color-text)",
        }}>
          System
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          {(["5m", "15m", "30m", "1h"] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                border: `1px solid ${range === r ? "var(--color-accent-border)" : "transparent"}`,
                background: range === r ? "var(--color-accent-dim)" : "transparent",
                color: range === r ? "var(--color-accent-light)" : "var(--color-text-faint)",
                fontSize: "9px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* CPU */}
      <MetricChart
        label="CPU"
        value={`${latestCpu}%`}
        color="var(--color-accent)"
        gradientId="dropCpuGrad"
        dataKey="cpu"
        data={filteredHistory}
      />

      {/* Memory */}
      <MetricChart
        label="Memory"
        value={`${latestMemPct}%`}
        color="var(--color-info)"
        gradientId="dropMemGrad"
        dataKey="memoryPct"
        data={filteredHistory}
      />

      {/* Disk */}
      <MetricChart
        label="Disk"
        value={`${latestDiskPct}%`}
        color="var(--color-success)"
        gradientId="dropDiskGrad"
        dataKey="diskPct"
        data={filteredHistory}
      />

      {/* Stats */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 10px",
        fontSize: "9px",
        fontFamily: "var(--font-mono)",
        color: "var(--color-text-faint)",
        paddingTop: 6,
        borderTop: "1px solid var(--color-border)",
      }}>
        <span>{cpuCount} cores</span>
        <span>{formatBytes(memoryUsed)} / {formatBytes(memoryTotal)} RAM</span>
        {swapTotal > 0 && <span>{formatBytes(swapUsed)} / {formatBytes(swapTotal)} swap</span>}
        <span>{formatBytes(diskUsed)} / {formatBytes(diskTotal)} disk</span>
        <span>up {formatUptime(uptime)}</span>
      </div>
    </>
  );
}

function MetricChart({ label, value, color, gradientId, dataKey, data }: {
  label: string;
  value: string;
  color: string;
  gradientId: string;
  dataKey: string;
  data: MetricsDataPoint[];
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 3,
      }}>
        <span style={{
          fontSize: "10px",
          color: "var(--color-text-secondary)",
          fontFamily: "var(--font-display)",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: "11px",
          color,
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
        }}>
          {value}
        </span>
      </div>
      <div style={{
        height: 40,
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
