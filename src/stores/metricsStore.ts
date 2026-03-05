import { create } from "zustand";

export interface MetricsDataPoint {
  timestamp: number;
  cpu: number;
  memoryPct: number;
  diskPct: number;
}

interface MetricsState {
  history: MetricsDataPoint[];
  latestCpu: number;
  latestMemPct: number;
  latestDiskPct: number;
  memoryUsed: number;
  memoryTotal: number;
  swapUsed: number;
  swapTotal: number;
  cpuCount: number;
  diskUsed: number;
  diskTotal: number;
  uptime: number;

  addDataPoint: (data: {
    cpu: number;
    memPct: number;
    diskPct: number;
    memUsed: number;
    memTotal: number;
    swapUsed: number;
    swapTotal: number;
    cpuCount: number;
    diskUsed: number;
    diskTotal: number;
    uptime: number;
  }) => void;
}

const MAX_HISTORY = 720; // 1h a cada 5s

export const useMetricsStore = create<MetricsState>((set) => ({
  history: [],
  latestCpu: 0,
  latestMemPct: 0,
  latestDiskPct: 0,
  memoryUsed: 0,
  memoryTotal: 0,
  swapUsed: 0,
  swapTotal: 0,
  cpuCount: 0,
  diskUsed: 0,
  diskTotal: 0,
  uptime: 0,

  addDataPoint: (data) =>
    set((s) => {
      const point: MetricsDataPoint = {
        timestamp: Date.now(),
        cpu: data.cpu,
        memoryPct: data.memPct,
        diskPct: data.diskPct,
      };
      const history = [...s.history, point].slice(-MAX_HISTORY);
      return {
        history,
        latestCpu: data.cpu,
        latestMemPct: data.memPct,
        latestDiskPct: data.diskPct,
        memoryUsed: data.memUsed,
        memoryTotal: data.memTotal,
        swapUsed: data.swapUsed,
        swapTotal: data.swapTotal,
        cpuCount: data.cpuCount,
        diskUsed: data.diskUsed,
        diskTotal: data.diskTotal,
        uptime: data.uptime,
      };
    }),
}));
