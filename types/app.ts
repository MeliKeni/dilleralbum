import type { Database } from './database';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Album = Database['public']['Tables']['albums']['Row'];
export type Page = Database['public']['Tables']['pages']['Row'];
export type Sticker = Database['public']['Tables']['stickers']['Row'];
export type UserSticker = Database['public']['Tables']['user_stickers']['Row'];
export type AlbumPlacement = Database['public']['Tables']['album_placements']['Row'];
export type PackConfig = Database['public']['Tables']['pack_configs']['Row'];
export type UserPack = Database['public']['Tables']['user_packs']['Row'];
export type Code = Database['public']['Tables']['codes']['Row'];
export type Trade = Database['public']['Tables']['trades']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type TradeStatus = Database['public']['Tables']['trades']['Row']['status'];

export interface StickerWithOwnership extends Sticker {
  quantity: number;
  is_placed: boolean;
}

export interface TradeWithDetails extends Trade {
  proposer: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  receiver: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>;
  offered_stickers: (Sticker & { quantity: number })[];
  requested_stickers: (Sticker & { quantity: number })[];
}

export interface OpenPackResult {
  success: boolean;
  stickers: (Sticker & { was_duplicate: boolean })[];
  opening_id: string;
}

export interface UserStats {
  total_album_slots: number;
  placed_stickers: number;
  completion_pct: number;
  total_extras_slots: number;
  extras_collected: number;
  duplicates: number;
  packs_opened: number;
}

export type CollectionFilter = 'all' | 'not_placed' | 'duplicates' | 'extras';
export type CollectionSort = 'number' | 'name' | 'quantity';
