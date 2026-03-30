"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { useProfile } from "@/hooks/useProfile";

/** Silently ensures profile+wallet exist on first authenticated page load */
function ProfileEnsurer() {
  const { isSignedIn } = useAuth();
  // This triggers GET /api/auth/profile which auto-creates profile+wallet if missing
  useProfile({ enabled: !!isSignedIn });
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000, // 30s
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProfileEnsurer />
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            fontSize: "14px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
