"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  total_users: number;
  users_24h: number;
  users_7d: number;
  users_30d: number;
  kyc_verified: number;
  kyc_pending: number;
  active_markets: number;
  total_volume: number;
  total_deposits: number;
  total_withdrawals: number;
  total_fees: number;
  users_with_balance: number;
  users_with_trades: number;
}

interface RecentUser {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  kyc_status: string;
  created_at: string;
}

const kycStatusConfig: Record<string, { label: string; className: string }> = {
  none: { label: "Sem KYC", className: "bg-white/10 text-white/50" },
  pending: { label: "Pendente", className: "bg-amber-500/15 text-amber-400" },
  verified: { label: "Verificado", className: "bg-emerald-500/15 text-emerald-400" },
  rejected: { label: "Rejeitado", className: "bg-red-500/15 text-red-400" },
};

export default function TenantDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailySignups, setDailySignups] = useState<Record<string, number>>({});
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/tenant/stats");
        if (!res.ok) throw new Error("Erro ao carregar dados");
        const data = await res.json();
        setStats(data.stats);
        setDailySignups(data.daily_signups || {});
        setRecentUsers(data.recent_users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Icon name="alert-triangle" className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-sm font-semibold mb-1">Erro ao carregar dashboard</p>
        <p className="text-xs text-white/50">{error}</p>
      </div>
    );
  }

  const conversionRate = stats && stats.total_users > 0
    ? ((stats.users_with_trades / stats.total_users) * 100).toFixed(1)
    : "0";

  const depositRate = stats && stats.total_users > 0
    ? ((stats.users_with_balance / stats.total_users) * 100).toFixed(1)
    : "0";

  // Daily signups chart (simple bar chart)
  const days = Object.entries(dailySignups).slice(-14);
  const maxSignups = Math.max(...days.map(([, v]) => v), 1);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Dashboard de Captacao</h1>
        <p className="text-sm text-white/50 mt-0.5 capitalize">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Usuarios", value: stats?.total_users ?? 0, icon: "users", color: "text-blue-400", bg: "bg-blue-500/10", format: "number" },
          { label: "Novos (24h)", value: stats?.users_24h ?? 0, icon: "trend-up", color: "text-emerald-400", bg: "bg-emerald-500/10", format: "number" },
          { label: "Novos (7d)", value: stats?.users_7d ?? 0, icon: "trend-up", color: "text-cyan-400", bg: "bg-cyan-500/10", format: "number" },
          { label: "Novos (30d)", value: stats?.users_30d ?? 0, icon: "trend-up", color: "text-violet-400", bg: "bg-violet-500/10", format: "number" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            {loading ? (
              <div>
                <Skeleton className="w-9 h-9 rounded-full mb-3" />
                <Skeleton className="h-7 w-20 mb-1.5" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <div>
                <div className={`w-9 h-9 rounded-full ${card.bg} flex items-center justify-center mb-3`}>
                  <Icon name={card.icon} className={`w-[18px] h-[18px] ${card.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono">
                  {card.format === "currency" ? formatCurrency(card.value) : card.value.toLocaleString("pt-BR")}
                </p>
                <p className="text-sm text-white/50 mt-1">{card.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel + Financial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Conversion Funnel */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Funil de Conversao</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Cadastrados", value: stats?.total_users ?? 0, pct: "100", color: "bg-blue-500" },
                { label: "KYC Verificado", value: stats?.kyc_verified ?? 0, pct: stats && stats.total_users > 0 ? ((stats.kyc_verified / stats.total_users) * 100).toFixed(1) : "0", color: "bg-emerald-500" },
                { label: "Com Saldo", value: stats?.users_with_balance ?? 0, pct: depositRate, color: "bg-amber-500" },
                { label: "Com Trades", value: stats?.users_with_trades ?? 0, pct: conversionRate, color: "bg-violet-500" },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70">{step.label}</span>
                      <span className="text-xs font-mono font-medium">{step.value} ({step.pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${step.color} transition-all`} style={{ width: `${step.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Resumo Financeiro</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Volume Total", value: formatCurrency(stats?.total_volume ?? 0), icon: "trend-up", color: "text-blue-400" },
                { label: "Total Depositos", value: formatCurrency(stats?.total_deposits ?? 0), icon: "trend-up", color: "text-emerald-400" },
                { label: "Total Saques", value: formatCurrency(stats?.total_withdrawals ?? 0), icon: "share", color: "text-amber-400" },
                { label: "Taxas Coletadas", value: formatCurrency(stats?.total_fees ?? 0), icon: "wallet", color: "text-violet-400" },
                { label: "Mercados Ativos", value: String(stats?.active_markets ?? 0), icon: "bar-chart", color: "text-cyan-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} className={`w-4 h-4 ${item.color}`} />
                    <span className="text-xs text-white/70">{item.label}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Signups Chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
        <h2 className="text-sm font-semibold mb-4">Cadastros Diarios (14 dias)</h2>
        {loading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : days.length === 0 ? (
          <p className="text-sm text-white/40 py-8 text-center">Sem dados de cadastro</p>
        ) : (
          <div className="flex items-end gap-1.5 h-32">
            {days.map(([date, count]) => {
              const height = (count / maxSignups) * 100;
              const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-white/60">{count}</span>
                  <div
                    className="w-full rounded-t bg-highlight/70 hover:bg-highlight transition-colors min-h-[4px]"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${dayLabel}: ${count} cadastros`}
                  />
                  <span className="text-[9px] text-white/40">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KYC Stats + Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* KYC Overview */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Status KYC</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: "Verificados", value: stats?.kyc_verified ?? 0, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Pendentes", value: stats?.kyc_pending ?? 0, color: "text-amber-400", bg: "bg-amber-500/10" },
                { label: "Sem KYC", value: (stats?.total_users ?? 0) - (stats?.kyc_verified ?? 0) - (stats?.kyc_pending ?? 0), color: "text-white/50", bg: "bg-white/5" },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between p-3 rounded-lg ${item.bg}`}>
                  <span className={`text-xs font-medium ${item.color}`}>{item.label}</span>
                  <span className="text-sm font-mono font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Usuarios Recentes</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentUsers.length === 0 ? (
            <p className="text-sm text-white/40 py-6 text-center">Nenhum usuario registrado</p>
          ) : (
            <ul className="space-y-2">
              {recentUsers.slice(0, 8).map((user) => {
                const kyc = kycStatusConfig[user.kyc_status] ?? kycStatusConfig.none;
                const timeAgo = getTimeAgo(user.created_at);
                return (
                  <li key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="user" className="w-4 h-4 text-white/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.display_name || user.handle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-white/40">@{user.handle}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${kyc.className}`}>
                          {kyc.label}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/30 shrink-0">{timeAgo}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
