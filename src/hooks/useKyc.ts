"use client";

import { useQuery } from "@tanstack/react-query";

export interface KycDocument {
  id: string;
  type: "id_front" | "proof_address";
  original_filename: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

export interface KycStatus {
  kyc_status: "none" | "pending" | "verified" | "rejected";
  documents: KycDocument[];
}

export function useKyc() {
  return useQuery<KycStatus | null>({
    queryKey: ["kyc"],
    queryFn: async () => {
      const res = await fetch("/api/kyc/status");
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60 * 1000,
    retry: false,
  });
}
