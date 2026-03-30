"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

export default function FollowButton({ handle }: { handle: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  async function handleToggleFollow() {
    if (!isSignedIn) {
      toast.error("Faça login para seguir usuários");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${handle}/follow`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || data.error || "Erro ao seguir");
        return;
      }

      const data = await res.json();
      setIsFollowing(data.following ?? !isFollowing);
      toast.success(data.following ? `Seguindo @${handle}` : `Deixou de seguir @${handle}`);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={handleToggleFollow}
      className={`px-5 py-2 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
        isFollowing
          ? "border-accent bg-accent/10 text-accent hover:bg-accent/20"
          : "border-border text-text-secondary hover:text-text hover:border-border-strong"
      } disabled:opacity-50`}
    >
      {isLoading ? "..." : isFollowing ? "Seguindo" : "Seguir"}
    </button>
  );
}
