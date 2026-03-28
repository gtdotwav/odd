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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["markets"]["Row"], "id" | "created_at" | "updated_at" | "volume" | "comment_count" | "variation_24h">;
        Update: Partial<Database["public"]["Tables"]["markets"]["Insert"]>;
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
      };
      comment_likes: {
        Row: {
          user_id: string;
          comment_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comment_likes"]["Row"], "created_at">;
        Update: never;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "created_at">;
        Update: never;
      };
      watchlist: {
        Row: {
          user_id: string;
          market_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["watchlist"]["Row"], "created_at">;
        Update: never;
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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
