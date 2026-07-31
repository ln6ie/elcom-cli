import { create } from "zustand";

interface UIState {
  selectedServerId: string | null;
  setSelectedServerId: (serverId: string | null) => void;
}

export const useUIStore = create<UIState>(set => ({
  selectedServerId: null,
  setSelectedServerId: selectedServerId => set({ selectedServerId }),
}));
