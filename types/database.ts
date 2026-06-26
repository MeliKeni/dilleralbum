export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type TradeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
export type NotificationType =
  | 'trade_received'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'trade_cancelled'
  | 'packs_received'
  | 'code_redeemed'
  | 'sticker_gifted';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          is_admin: boolean;
          is_blocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          is_admin?: boolean;
          is_blocked?: boolean;
        };
        Update: {
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
        };
      };
      albums: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          back_cover_image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['albums']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['albums']['Insert']>;
      };
      pages: {
        Row: {
          id: string;
          album_id: string;
          page_number: number;
          name: string;
          background_image_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pages']['Insert']>;
      };
      stickers: {
        Row: {
          id: string;
          album_id: string;
          page_id: string | null;
          sticker_number: string;
          name: string;
          display_name: string;
          image_url: string;
          is_extra: boolean;
          pos_x: number | null;
          pos_y: number | null;
          pos_width: number | null;
          pos_height: number | null;
          panoramic_group: string | null;
          metadata: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['stickers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['stickers']['Insert']>;
      };
      user_stickers: {
        Row: {
          id: string;
          user_id: string;
          sticker_id: string;
          quantity: number;
          first_obtained_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_stickers']['Row'], 'id' | 'first_obtained_at' | 'updated_at'>;
        Update: { quantity?: number };
      };
      album_placements: {
        Row: {
          id: string;
          user_id: string;
          sticker_id: string;
          placed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['album_placements']['Row'], 'id' | 'placed_at'>;
        Update: never;
      };
      pack_configs: {
        Row: {
          id: string;
          album_id: string;
          name: string;
          stickers_per_pack: number;
          include_extras: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pack_configs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['pack_configs']['Insert']>;
      };
      user_packs: {
        Row: {
          id: string;
          user_id: string;
          pack_config_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_packs']['Row'], 'id' | 'updated_at'>;
        Update: { quantity?: number };
      };
      daily_claims: {
        Row: {
          id: string;
          user_id: string;
          claimed_date: string;
          packs_given: number;
        };
        Insert: Omit<Database['public']['Tables']['daily_claims']['Row'], 'id'>;
        Update: never;
      };
      pack_openings: {
        Row: {
          id: string;
          user_id: string;
          pack_config_id: string;
          opened_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pack_openings']['Row'], 'id' | 'opened_at'>;
        Update: never;
      };
      pack_opening_results: {
        Row: {
          id: string;
          opening_id: string;
          sticker_id: string;
          was_duplicate: boolean;
        };
        Insert: Omit<Database['public']['Tables']['pack_opening_results']['Row'], 'id'>;
        Update: never;
      };
      codes: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          pack_config_id: string | null;
          packs_amount: number;
          max_uses: number | null;
          uses_count: number;
          is_single_use_per_user: boolean;
          expires_at: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['codes']['Row'], 'id' | 'uses_count' | 'created_at'>;
        Update: Partial<Pick<Database['public']['Tables']['codes']['Row'], 'is_active' | 'description' | 'expires_at'>>;
      };
      code_redemptions: {
        Row: {
          id: string;
          code_id: string;
          user_id: string;
          redeemed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['code_redemptions']['Row'], 'id' | 'redeemed_at'>;
        Update: never;
      };
      trades: {
        Row: {
          id: string;
          proposer_id: string;
          receiver_id: string;
          status: TradeStatus;
          message: string | null;
          created_at: string;
          updated_at: string;
          expires_at: string;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['trades']['Row'], 'id' | 'status' | 'created_at' | 'updated_at' | 'expires_at' | 'completed_at'>;
        Update: { status?: TradeStatus; completed_at?: string };
      };
      trade_offered_stickers: {
        Row: { id: string; trade_id: string; sticker_id: string; quantity: number };
        Insert: Omit<Database['public']['Tables']['trade_offered_stickers']['Row'], 'id'>;
        Update: never;
      };
      trade_requested_stickers: {
        Row: { id: string; trade_id: string; sticker_id: string; quantity: number };
        Insert: Omit<Database['public']['Tables']['trade_requested_stickers']['Row'], 'id'>;
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at' | 'is_read'>;
        Update: { is_read?: boolean };
      };
    };
    Functions: {
      get_user_stats: { Args: { p_user_id: string }; Returns: Json };
    };
  };
}
