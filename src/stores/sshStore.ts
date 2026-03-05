import { create } from "zustand";

interface SSHState {
  connectDialogOpen: boolean;
  toggleConnectDialog: () => void;
}

export const useSSHStore = create<SSHState>((set) => ({
  connectDialogOpen: false,
  toggleConnectDialog: () => set((s) => ({ connectDialogOpen: !s.connectDialogOpen })),
}));
