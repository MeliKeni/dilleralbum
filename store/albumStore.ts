import { create } from 'zustand';
import type { Sticker, UserSticker, AlbumPlacement, UserPack } from '@/types/app';

interface AlbumState {
  stickers: Sticker[];
  userStickers: Map<string, number>; // sticker_id -> quantity
  placements: Set<string>; // sticker_ids placed
  userPacks: UserPack[];
  isLoading: boolean;
  lastFetched: number | null;

  setStickers: (stickers: Sticker[]) => void;
  setUserStickers: (us: UserSticker[]) => void;
  setPlacements: (placements: AlbumPlacement[]) => void;
  setUserPacks: (packs: UserPack[]) => void;
  addStickers: (us: UserSticker[]) => void;
  addPlacement: (stickerId: string) => void;
  decrementPack: (packConfigId: string) => void;
  incrementPack: (packConfigId: string, amount: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAlbumStore = create<AlbumState>((set, get) => ({
  stickers: [],
  userStickers: new Map(),
  placements: new Set(),
  userPacks: [],
  isLoading: false,
  lastFetched: null,

  setStickers: (stickers) => set({ stickers }),

  setUserStickers: (us) => {
    const map = new Map(us.map((s) => [s.sticker_id, s.quantity]));
    set({ userStickers: map });
  },

  setPlacements: (placements) => {
    const set_ = new Set(placements.map((p) => p.sticker_id));
    set({ placements: set_ });
  },

  setUserPacks: (packs) => set({ userPacks: packs }),

  addStickers: (us) => {
    const current = new Map(get().userStickers);
    for (const s of us) {
      current.set(s.sticker_id, s.quantity);
    }
    set({ userStickers: current });
  },

  addPlacement: (stickerId) => {
    const placements = new Set(get().placements);
    placements.add(stickerId);
    set({ placements });
  },

  decrementPack: (packConfigId) => {
    const packs = get().userPacks.map((p) =>
      p.pack_config_id === packConfigId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
    );
    set({ userPacks: packs });
  },

  incrementPack: (packConfigId, amount) => {
    const packs = get().userPacks.map((p) =>
      p.pack_config_id === packConfigId ? { ...p, quantity: p.quantity + amount } : p
    );
    set({ userPacks: packs });
  },

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      stickers: [],
      userStickers: new Map(),
      placements: new Set(),
      userPacks: [],
      isLoading: false,
      lastFetched: null,
    }),
}));
