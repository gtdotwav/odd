"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface Stats {
  [key: string]: number | undefined;
  total_users: number;
  active_markets: number;
  total_volume: number;
  pending_orders: number;
  total_fees: number;
  total_comments: number;
  users_24h?: number;
  markets_24h?: number;
  volume_24h?: number;
  orders_24h?: number;
  fees_24h?: number;
  comments_24h?: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  created_at: string;
  user_name?: string;
}

const statCards = [
  { key: "total_users", label: "Usuarios", icon: "users", color: "text-accent", bgColor: "bg-accent/10", deltaKey: "users_24h", isCurrency: false },
  { key: "active_markets", label: "Mercados Ativos", icon: "bar-chart", color: "text-up", bgColor: "bg-up/10", deltaKey: "markets_24h", isCurrency: false },
  { key: "total_volume", label: "Volume Total", icon: "trend-up", color: "text-highlight", bgColor: "bg-highlight/10", deltaKey: "volume_24h", isCurrency: true },
  { key: "pending_orders", label: "Ordens Pendentes", icon: "zap", color: "text-neutral-warn", bgColor: "bg-neutral-warn/10", deltaKey: "orders_24h", isCurrency: false },
  { key: "total_fees", label: "Taxas Coletadas", icon: "wallet", color: "text-up", bgColor: "bg-up/10", deltaKey: "fees_24h", isCurrency: true },
  { key: "total_comments", label: "Comentarios", icon: "inbox", color: "text-accent", bgColor: "bg-accent/10", deltaKey: "comments_24h", isCurrency: false },
] as const;

const quickActions = [
  { href: "/admin/mercados/novo", icon: "plus", label: "Criar Mercado", description: "Adicionar novo mercado de previsao" },
  { href: "/admin/mercados?status=disputed", icon: "alert-triangle", label: "Ver Disputados", description: "Mercados com disputas pendentes" },
  { href: "/admin/usuarios?kyc_status=pending", icon: "shield", label: "Verificar KYC", description: "Usuarios aguardando verificacao" },
];

interface SyncStatus {
  loading: boolean;
  result: { created: number; updated: number; errors: string[] } | null;
}

function activityIcon(type: string): string {
  switch (type) {
    case "market_created": return "bar-chart";
    case "market_resolved": return "check";
    case "user_registered": return "user";
    case "order_placed": return "zap";
    case "deposit": return "wallet";
    case "comment": return "inbox";
    default: return "clock";
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sync, setSync] = useState<SyncStatus>({ loading: false, result: null });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const data = await res.json();
        setStats(data.stats);
        setActivity(data.recent_activity || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSync() {
    setSync({ loading: true, result: null });
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro no sync");
      setSync({ loading: false, result: data });
    } catch (err) {
      setSync({ loading: false, result: { created: 0, updated: 0, errors: [err instanceof Error ? err.message : "Erro"] } });
    }
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full bg-down/10 flex items-center justify-center mb-4">
          <Icon name="alert-triangle" className="w-6 h-6 text-down" />
        </div>
        <p className="text-sm font-semibold text-text mb-1">Erro ao carregar dashboard</p>
        <p className="text-xs text-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Dashboard</h1>
        <p className="text-sm text-text-secondary mt-0.5 capitalize">{today}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.key} className="rounded-xl border border-border bg-surface p-5">
            {loading ? (
              <div>
                <Skeleton className="w-9 h-9 rounded-full mb-3" />
                <Skeleton className="h-7 w-24 mb-1.5" />
                <Skeleton className="h-4 w-20" />
              </div>
            ) : (
              <div>
                <div className={`w-9 h-9 rounded-full ${card.bgColor} flex items-center justify-center mb-3`}>
                  <Icon name={card.icon} className={`w-[18px] h-[18px] ${card.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono text-text">
                  {card.isCurrency
                    ? formatCurrency(stats?.[card.key] ?? 0)
                    : (stats?.[card.key] ?? 0).toLocaleString("pt-BR")}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-text-secondary">{card.label}</p>
                  {stats && stats[card.deltaKey] != null && (
                    <span className="text-xs text-text-tertiary">
                      +{stats[card.deltaKey]} 24h
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom section: activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity feed */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Atividade Recente</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-text-tertiary py-8 text-center">Nenhuma atividade recente</p>
          ) : (
            <ul className="space-y-3">
              {activity.slice(0, 10).map((item, idx) => (
                <li key={item.id || idx} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                    <Icon name={activityIcon(item.type)} className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text leading-snug">{item.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {item.user_name && (
                        <span className="text-xs text-text-secondary">{item.user_name}</span>
                      )}
                      <span className="text-xs text-text-tertiary">
                        {formatRelativeTime(item.created_at)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-text mb-4">Acoes Rapidas</h2>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-surface-raised transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                  <Icon name={action.icon} className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{action.label}</p>
                  <p className="text-xs text-text-secondary">{action.description}</p>
                </div>
                <Icon name="chevron-right" className="w-4 h-4 text-text-tertiary" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Polymarket Sync */}
      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text">Sync Polymarket</h2>
            <p className="text-xs text-text-secondary mt-0.5">Importar mercados populares da Polymarket (top 30 por volume 24h)</p>
          </div>
          <button
            onClick={handleSync}
            disabled={sync.loading}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sync.loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Icon name="refresh" className="w-4 h-4" />
                Sincronizar
              </>
            )}
          </button>
        </div>
        {sync.result && (
          <div className={`rounded-lg p-3 text-sm ${sync.result.errors.length > 0 ? 'bg-neutral-warn/10 border border-neutral-warn/20' : 'bg-up/10 border border-up/20'}`}>
            <p className="font-medium">
              {sync.result.created} criados, {sync.result.updated} atualizados
              {sync.result.errors.length > 0 && `, ${sync.result.errors.length} erros`}
            </p>
            {sync.result.errors.length > 0 && (
              <ul className="mt-1 text-xs text-text-secondary">
                {sync.result.errors.slice(0, 3).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
