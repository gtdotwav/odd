"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string;
  type: "trade_filled" | "market_resolved" | "price_alert" | "new_follower" | "comment_reply" | "payout";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    data?: { href?: string } | null;
    read: boolean;
    created_at: string;
  }>;
  unread_count: number;
}

const typeConfig: Record<string, { icon: string; iconClass: string; bgClass: string }> = {
  trade_filled: { icon: "zap", iconClass: "text-accent", bgClass: "bg-accent/10" },
  market_resolved: { icon: "check", iconClass: "text-up", bgClass: "bg-up/10" },
  price_alert: { icon: "trend-up", iconClass: "text-neutral-warn", bgClass: "bg-neutral-warn/15" },
  new_follower: { icon: "star", iconClass: "text-accent", bgClass: "bg-accent/10" },
  comment_reply: { icon: "building", iconClass: "text-text-secondary", bgClass: "bg-surface-raised" },
  payout: { icon: "gift", iconClass: "text-up", bgClass: "bg-up/10" },
};

function mapNotification(raw: NotificationsResponse["notifications"][number]): Notification {
  return {
    id: raw.id,
    type: raw.type as Notification["type"],
    title: raw.title,
    body: raw.body,
    href: raw.data?.href ?? undefined,
    read: raw.read,
    createdAt: raw.created_at,
  };
}

function NotificationItem({ notification }: { notification: Notification }) {
  const config = typeConfig[notification.type] ?? typeConfig.trade_filled;
  const className = `flex items-start gap-3 p-4 rounded-lg border transition-colors ${
    notification.read
      ? "border-border bg-surface hover:bg-surface-raised"
      : "border-accent/20 bg-accent/5 hover:bg-accent/10"
  }`;

  const content = (
    <>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${config.bgClass}`}>
        <Icon name={config.icon} className={`w-4 h-4 ${config.iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-medium text-text">{notification.title}</h3>
          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
          )}
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">{notification.body}</p>
        <p className="text-[11px] text-text-tertiary mt-1">{formatRelativeTime(notification.createdAt)}</p>
      </div>
    </>
  );

  if (notification.href) {
    return <Link href={notification.href} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-surface">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificacoesPage() {
  const queryClient = useQueryClient();

  let isSignedIn = false;
  try {
    const authState = useAuth();
    isSignedIn = !!authState.isSignedIn;
  } catch {
    // Clerk not configured
  }

  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Erro ao carregar notificações");
      return res.json();
    },
    enabled: isSignedIn,
    staleTime: 30 * 1000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Erro ao marcar como lidas");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Todas as notificações marcadas como lidas");
    },
    onError: () => {
      toast.error("Erro ao marcar notificações como lidas");
    },
  });

  const notifications = (data?.notifications ?? []).map(mapNotification);
  const unreadCount = data?.unread_count ?? 0;

  if (!isSignedIn) {
    return (
      <div className="flex max-w-[1440px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <h1 className="text-xl font-bold text-text mb-6">Notificacoes</h1>
          <EmptyState
            icon="bell"
            title="Faça login"
            description="Entre na sua conta para ver suas notificações."
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text">Notificacoes</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                {unreadCount} {unreadCount === 1 ? "nova" : "novas"}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
              className="text-sm text-accent hover:underline font-medium disabled:opacity-50"
            >
              {markAllRead.isPending ? "Marcando..." : "Marcar todas como lidas"}
            </button>
          )}
        </div>

        {isLoading ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="Nenhuma notificacao"
            description="Voce sera notificado sobre ordens executadas, resolucoes de mercado e muito mais."
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
