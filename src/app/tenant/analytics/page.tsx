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

export default function TenantAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [dailySignups, setDailySignups] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setDailySignups(data.daily_signups || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const days = Object.entries(dailySignups);
  const maxSignups = Math.max(...days.map(([, v]) => v), 1);
  const totalSignupsRange = days.reduce((sum, [, v]) => sum + v, 0);

  // Calculate metrics
  const avgDailySignups = days.length > 0 ? (totalSignupsRange / days.length).toFixed(1) : "0";
  const signupTrend = days.length >= 14
    ? (() => {
        const first7 = days.slice(0, 7).reduce((s, [, v]) => s + v, 0);
        const last7 = days.slice(-7).reduce((s, [, v]) => s + v, 0);
        return first7 > 0 ? (((last7 - first7) / first7) * 100).toFixed(1) : "0";
      })()
    : "0";

  const conversionRate = stats && stats.total_users > 0
    ? ((stats.users_with_trades / stats.total_users) * 100).toFixed(1)
    : "0";
  const depositRate = stats && stats.total_users > 0
    ? ((stats.users_with_balance / stats.total_users) * 100).toFixed(1)
    : "0";
  const kycRate = stats && stats.total_users > 0
    ? ((stats.kyc_verified / stats.total_users) * 100).toFixed(1)
    : "0";
  const avgDeposit = stats && stats.users_with_balance > 0
    ? stats.total_deposits / stats.users_with_balance
    : 0;
  const avgVolume = stats && stats.users_with_trades > 0
    ? stats.total_volume / stats.users_with_trades
    : 0;
  const netFlow = (stats?.total_deposits ?? 0) - (stats?.total_withdrawals ?? 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Analytics de Captacao</h1>
        <p className="text-sm text-white/50 mt-0.5">Metricas de aquisicao, conversao e retencao</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Media diaria cadastros", value: avgDailySignups, sub: `${totalSignupsRange} total (30d)`, icon: "users", color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Taxa de conversao", value: `${conversionRate}%`, sub: `${stats?.users_with_trades ?? 0} traders`, icon: "trend-up", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Taxa de deposito", value: `${depositRate}%`, sub: `${stats?.users_with_balance ?? 0} com saldo`, icon: "wallet", color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Tendencia (WoW)", value: `${Number(signupTrend) >= 0 ? "+" : ""}${signupTrend}%`, sub: "vs semana anterior", icon: "bar-chart", color: Number(signupTrend) >= 0 ? "text-emerald-400" : "text-red-400", bg: Number(signupTrend) >= 0 ? "bg-emerald-500/10" : "bg-red-500/10" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            {loading ? (
              <div><Skeleton className="w-9 h-9 rounded-full mb-3" /><Skeleton className="h-7 w-20 mb-1" /><Skeleton className="h-4 w-28" /></div>
            ) : (
              <div>
                <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center mb-3`}>
                  <Icon name={m.icon} className={`w-[18px] h-[18px] ${m.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono">{m.value}</p>
                <p className="text-xs text-white/40 mt-1">{m.sub}</p>
                <p className="text-xs text-white/60 mt-0.5">{m.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Funnel */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5 mb-8">
        <h2 className="text-sm font-semibold mb-4">Funil Detalhado</h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <div className="space-y-4">
            {[
              { label: "1. Cadastro", value: stats?.total_users ?? 0, pct: 100, desc: "Usuarios registrados via Clerk", color: "bg-blue-500" },
              { label: "2. KYC Completo", value: stats?.kyc_verified ?? 0, pct: Number(kycRate), desc: "Identidade verificada (ID + comprovante)", color: "bg-cyan-500" },
              { label: "3. Primeiro Deposito", value: stats?.users_with_balance ?? 0, pct: Number(depositRate), desc: "Depositaram saldo na carteira", color: "bg-amber-500" },
              { label: "4. Primeiro Trade", value: stats?.users_with_trades ?? 0, pct: Number(conversionRate), desc: "Executaram pelo menos 1 operacao", color: "bg-emerald-500" },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-xs text-white/40 ml-2">{step.desc}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold">{step.value} <span className="text-white/40">({step.pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div className={`h-full rounded-full ${step.color} transition-all duration-500`} style={{ width: `${Math.max(step.pct, 1)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-3">Ticket Medio Deposito</h2>
          {loading ? <Skeleton className="h-8 w-24" /> : (
            <p className="text-2xl font-mono font-bold">{formatCurrency(avgDeposit)}</p>
          )}
          <p className="text-xs text-white/40 mt-1">por usuario com saldo</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-3">Volume Medio / Trader</h2>
          {loading ? <Skeleton className="h-8 w-24" /> : (
            <p className="text-2xl font-mono font-bold">{formatCurrency(avgVolume)}</p>
          )}
          <p className="text-xs text-white/40 mt-1">volume por trader ativo</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-3">Fluxo Liquido</h2>
          {loading ? <Skeleton className="h-8 w-24" /> : (
            <p className={`text-2xl font-mono font-bold ${netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
            </p>
          )}
          <p className="text-xs text-white/40 mt-1">depositos - saques</p>
        </div>
      </div>

      {/* Full Chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold mb-4">Cadastros Diarios (30 dias)</h2>
        {loading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : days.length === 0 ? (
          <p className="text-sm text-white/40 py-8 text-center">Sem dados</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {days.map(([date, count]) => {
              const height = (count / maxSignups) * 100;
              const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-white/50">{count}</span>
                  <div
                    className="w-full rounded-t bg-highlight/60 hover:bg-highlight transition-colors min-h-[4px]"
                    style={{ height: `${Math.max(height, 3)}%` }}
                    title={`${dayLabel}: ${count}`}
                  />
                  <span className="text-[8px] text-white/30 -rotate-45 origin-center">{dayLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
