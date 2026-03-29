import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Notificacoes",
  description: "Suas notificacoes na Odd — ordens, resolucoes, alertas e mais.",
};

interface Notification {
  id: string;
  type: "trade_filled" | "market_resolved" | "price_alert" | "new_follower" | "comment_reply" | "payout";
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: string; iconClass: string; bgClass: string }> = {
  trade_filled: { icon: "zap", iconClass: "text-accent", bgClass: "bg-accent/10" },
  market_resolved: { icon: "check", iconClass: "text-up", bgClass: "bg-up/10" },
  price_alert: { icon: "trend-up", iconClass: "text-neutral-warn", bgClass: "bg-neutral-warn/15" },
  new_follower: { icon: "star", iconClass: "text-accent", bgClass: "bg-accent/10" },
  comment_reply: { icon: "building", iconClass: "text-text-secondary", bgClass: "bg-surface-raised" },
  payout: { icon: "gift", iconClass: "text-up", bgClass: "bg-up/10" },
};

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "trade_filled",
    title: "Ordem executada",
    body: "Sua ordem de compra de 50x Sim no mercado 'Selic sobe em maio?' foi executada a R$ 0,78.",
    href: "/mercado/selic-sobe-maio-2026",
    read: false,
    createdAt: "2026-03-29T10:30:00Z",
  },
  {
    id: "n2",
    type: "market_resolved",
    title: "Mercado resolvido",
    body: "O mercado 'Lula veta marco temporal?' foi resolvido como Sim. Voce ganhou R$ 85,00.",
    href: "/mercado/lula-veta-marco-temporal",
    read: false,
    createdAt: "2026-03-28T18:00:00Z",
  },
  {
    id: "n3",
    type: "price_alert",
    title: "Alerta de preco",
    body: "Bitcoin 100k em junho? atingiu 62% (seu alerta: 60%).",
    href: "/mercado/bitcoin-100k-junho",
    read: false,
    createdAt: "2026-03-28T14:15:00Z",
  },
  {
    id: "n4",
    type: "new_follower",
    title: "Novo seguidor",
    body: "@carla_invest comecou a seguir voce.",
    href: "/u/carla_invest",
    read: true,
    createdAt: "2026-03-27T11:00:00Z",
  },
  {
    id: "n5",
    type: "comment_reply",
    title: "Resposta ao comentario",
    body: "@trader_rj respondeu: 'Concordo, o cenario macro aponta para alta'.",
    href: "/mercado/selic-sobe-maio-2026",
    read: true,
    createdAt: "2026-03-27T09:30:00Z",
  },
  {
    id: "n6",
    type: "payout",
    title: "Pagamento recebido",
    body: "Voce recebeu R$ 85,00 pela resolucao do mercado 'Lula veta marco temporal?'.",
    read: true,
    createdAt: "2026-03-26T08:00:00Z",
  },
];

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

export default async function NotificacoesPage() {
  // TODO: fetch from /api/notifications
  const notifications = mockNotifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

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
              className="text-sm text-accent hover:underline font-medium"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
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
