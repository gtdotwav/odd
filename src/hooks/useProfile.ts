"use client";

import { useQuery } from "@tanstack/react-query";

export interface UserProfile {
  id: string;
  clerk_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  kyc_status: string;
  balance: number;
  created_at: string;
  total_trades: number;
  total_volume: number;
  unread_notifications: number;
}

export function useProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/auth/profile");
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}
