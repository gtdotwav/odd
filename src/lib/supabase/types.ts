export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          clerk_id: string;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          kyc_status: "none" | "pending" | "verified" | "rejected";
          role: "user" | "admin" | "moderator";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at" | "role"> & { role?: "user" | "admin" | "moderator" };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      markets: {
        Row: {
          id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          category: string;
          type: "binary" | "multi" | "sport" | "crypto";
          status: "draft" | "active" | "live" | "closing" | "resolved_yes" | "resolved_no" | "disputed" | "cancelled";
          price_yes: number;
          price_no: number;
          variation_24h: number;
          volume: number;
          comment_count: number;
          resolution_date: string;
          context: string | null;
          rules: string | null;
          source: string | null;
          featured: boolean;
          created_by: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          polymarket_id: string | null;
          polymarket_slug: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["markets"]["Row"], "id" | "created_at" | "updated_at" | "volume" | "comment_count" | "variation_24h" | "polymarket_id" | "polymarket_slug" | "image_url" | "created_by" | "resolved_at" | "resolved_by"> & { polymarket_id?: string | null; polymarket_slug?: string | null; image_url?: string | null; created_by?: string | null; resolved_at?: string | null; resolved_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["markets"]["Insert"]>;
        Relationships: [];
      };
      outcomes: {
        Row: {
          id: string;
          market_id: string;
          label: string;
          probability: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["outcomes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["outcomes"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          outcome_id: string | null;
          side: "yes" | "no";
          type: "market" | "limit";
          price: number;
          quantity: number;
          filled_quantity: number;
          status: "pending" | "partial" | "filled" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at" | "filled_quantity">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      positions: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          outcome_id: string | null;
          side: "yes" | "no";
          quantity: number;
          avg_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["positions"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
        Relationships: [];
      };
      wallets: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["wallets"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["wallets"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          wallet_id: string;
          type: "deposit" | "withdrawal" | "trade_buy" | "trade_sell" | "payout" | "fee" | "refund";
          amount: number;
          balance_after: number;
          reference_id: string | null;
          description: string | null;
          status: "pending" | "completed" | "failed";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["transactions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          text: string;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at" | "updated_at" | "like_count">;
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      comment_likes: {
        Row: {
          user_id: string;
          comment_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comment_likes"]["Row"], "created_at">;
        Update: never;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "created_at">;
        Update: never;
        Relationships: [];
      };
      watchlist: {
        Row: {
          user_id: string;
          market_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["watchlist"]["Row"], "created_at">;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "trade_filled" | "market_resolved" | "price_alert" | "new_follower" | "comment_reply" | "payout";
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at" | "read">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]> & { read?: boolean };
        Relationships: [];
      };
      price_history: {
        Row: {
          id: string;
          market_id: string;
          price_yes: number;
          price_no: number;
          volume_delta: number;
          recorded_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["price_history"]["Row"], "id">;
        Update: never;
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          market_id: string;
          action: "buy" | "sell";
          side: "yes" | "no";
          amount: number;
          price: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">;
        Update: never;
        Relationships: [];
      };
      sport_data: {
        Row: {
          id: string;
          market_id: string;
          home_team: string;
          away_team: string;
          home_score: number | null;
          away_score: number | null;
          clock: string | null;
          status: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sport_data"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["sport_data"]["Insert"]>;
        Relationships: [];
      };
      crypto_data: {
        Row: {
          id: string;
          market_id: string;
          asset: string;
          current_price: number;
          target_price: number;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["crypto_data"]["Row"], "id" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["crypto_data"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_profile: { Args: { p_clerk_id: string; p_handle: string; p_display_name: string; p_avatar_url?: string | null }; Returns: string };
      place_order: { Args: { p_clerk_id: string; p_market_id: string; p_side: string; p_type: string; p_price: number; p_quantity: number }; Returns: Json };
      cancel_order: { Args: { p_clerk_id: string; p_order_id: string }; Returns: Json };
      post_comment: { Args: { p_clerk_id: string; p_market_id: string; p_text: string }; Returns: Json };
      toggle_watchlist: { Args: { p_clerk_id: string; p_market_id: string }; Returns: Json };
      toggle_comment_like: { Args: { p_clerk_id: string; p_comment_id: string }; Returns: Json };
      add_balance: { Args: { p_clerk_id: string; p_amount: number; p_reference?: string | null; p_description?: string | null }; Returns: Json };
      get_leaderboard: { Args: { p_limit?: number }; Returns: { user_id: string; handle: string; display_name: string; avatar_url: string | null; total_volume: number; total_trades: number; total_pnl: number }[] };
      get_user_orders: { Args: { p_clerk_id: string; p_status?: string | null }; Returns: Json };
      get_user_positions: { Args: { p_clerk_id: string }; Returns: Json };
      get_user_wallet: { Args: { p_clerk_id: string }; Returns: Json };
      get_user_notifications: { Args: { p_clerk_id: string }; Returns: Json };
      mark_notifications_read: { Args: { p_clerk_id: string; p_ids?: string[] | null }; Returns: Json };
      get_user_watchlist: { Args: { p_clerk_id: string }; Returns: Json };
      get_market_comments: { Args: { p_market_id: string; p_clerk_id?: string | null }; Returns: Json };
      get_user_profile: { Args: { p_clerk_id: string }; Returns: Json };
      get_public_profile: { Args: { p_handle: string }; Returns: Json };
      admin_get_stats: { Args: { p_clerk_id: string }; Returns: Json };
      admin_list_users: { Args: { p_clerk_id: string; p_search?: string | null; p_kyc_status?: string | null; p_role?: string | null; p_limit?: number; p_offset?: number }; Returns: Json };
      admin_update_user: { Args: { p_clerk_id: string; p_user_id: string; p_kyc_status?: string | null; p_role?: string | null }; Returns: Json };
      admin_list_markets: { Args: { p_clerk_id: string; p_status?: string | null; p_category?: string | null; p_search?: string | null; p_limit?: number; p_offset?: number }; Returns: Json };
      admin_create_market: { Args: { p_clerk_id: string; p_title: string; p_slug: string; p_category: string; p_type?: string; p_resolution_date?: string | null; p_subtitle?: string | null; p_context?: string | null; p_rules?: string | null; p_source?: string | null; p_status?: string; p_featured?: boolean }; Returns: Json };
      admin_update_market: { Args: { p_clerk_id: string; p_market_id: string; p_title?: string | null; p_subtitle?: string | null; p_category?: string | null; p_status?: string | null; p_resolution_date?: string | null; p_context?: string | null; p_rules?: string | null; p_source?: string | null; p_featured?: boolean | null }; Returns: Json };
      admin_resolve_market: { Args: { p_clerk_id: string; p_market_id: string; p_resolution: string }; Returns: Json };
      admin_list_orders: { Args: { p_clerk_id: string; p_status?: string | null; p_market_id?: string | null; p_side?: string | null; p_limit?: number; p_offset?: number }; Returns: Json };
      admin_list_transactions: { Args: { p_clerk_id: string; p_type?: string | null; p_status?: string | null; p_limit?: number; p_offset?: number }; Returns: Json };
      admin_list_comments: { Args: { p_clerk_id: string; p_market_id?: string | null; p_search?: string | null; p_limit?: number; p_offset?: number }; Returns: Json };
      admin_delete_comment: { Args: { p_clerk_id: string; p_comment_id: string }; Returns: Json };
      admin_recent_activity: { Args: { p_clerk_id: string; p_limit?: number }; Returns: Json };
    };
    Enums: Record<string, never>;
  };
}
