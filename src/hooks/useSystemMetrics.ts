import { useEffect } from "react";
import { getSystemMetrics } from "@/lib/tauri";
import { useMetricsStore } from "@/stores/metricsStore";

const POLL_INTERVAL = 5000;

export function useSystemMetrics() {
  const addDataPoint = useMetricsStore((s) => s.addDataPoint);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const m = await getSystemMetrics();
        if (!active) return;
        const memPct = m.memory_total > 0
          ? Math.round((m.memory_used / m.memory_total) * 100)
          : 0;
        const diskPct = m.disk_total > 0
          ? Math.round((m.disk_used / m.disk_total) * 100)
          : 0;
        addDataPoint({
          cpu: Math.round(m.cpu_usage),
          memPct,
          diskPct,
          memUsed: m.memory_used,
          memTotal: m.memory_total,
          swapUsed: m.swap_used,
          swapTotal: m.swap_total,
          cpuCount: m.cpu_count,
          diskUsed: m.disk_used,
          diskTotal: m.disk_total,
          uptime: m.uptime,
        });
      } catch {
        // Silenciar erros de metrica
      }
    };

    poll();
    const id = setInterval(poll, POLL_INTERVAL);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [addDataPoint]);
}
