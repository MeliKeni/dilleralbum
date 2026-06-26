import { create } from 'zustand';

interface UIState {
  unreadNotifications: number;
  setUnreadNotifications: (count: number) => void;
  decrementUnread: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  unreadNotifications: 0,
  setUnreadNotifications: (count) => set({ unreadNotifications: count }),
  decrementUnread: () =>
    set({ unreadNotifications: Math.max(0, get().unreadNotifications - 1) }),
}));
