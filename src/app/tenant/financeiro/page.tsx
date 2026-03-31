"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  total_volume: number;
  total_deposits: number;
  total_withdrawals: number;
  total_fees: number;
  users_with_balance: number;
  active_markets: number;
  total_users: number;
}

export default function TenantFinanceiro() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tenant/stats")
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .finally(() => setLoading(false));
  }, []);

  const netFlow = (stats?.total_deposits ?? 0) - (stats?.total_withdrawals ?? 0);
  const avgRevPerUser = stats && stats.total_users > 0 ? stats.total_fees / stats.total_users : 0;
  const avgVolPerMarket = stats && stats.active_markets > 0 ? stats.total_volume / stats.active_markets : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold">Financeiro</h1>
        <p className="text-sm text-white/50 mt-0.5">Visao geral das financas da plataforma</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Volume Total", value: formatCurrency(stats?.total_volume ?? 0), icon: "trend-up", color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Receita (Taxas)", value: formatCurrency(stats?.total_fees ?? 0), icon: "wallet", color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Depositos", value: formatCurrency(stats?.total_deposits ?? 0), icon: "trend-up", color: "text-cyan-400", bg: "bg-cyan-500/10" },
          { label: "Saques", value: formatCurrency(stats?.total_withdrawals ?? 0), icon: "share", color: "text-amber-400", bg: "bg-amber-500/10" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            {loading ? (
              <div><Skeleton className="w-9 h-9 rounded-full mb-3" /><Skeleton className="h-7 w-24 mb-1" /><Skeleton className="h-4 w-20" /></div>
            ) : (
              <div>
                <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center mb-3`}>
                  <Icon name={m.icon} className={`w-[18px] h-[18px] ${m.color}`} />
                </div>
                <p className="text-2xl font-bold font-mono">{m.value}</p>
                <p className="text-sm text-white/50 mt-1">{m.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Flow Summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Fluxo de Caixa</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5">
                <div className="flex items-center gap-2">
                  <Icon name="trend-up" className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white/70">Entrada (Depositos)</span>
                </div>
                <span className="text-sm font-mono font-semibold text-emerald-400">+{formatCurrency(stats?.total_deposits ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5">
                <div className="flex items-center gap-2">
                  <Icon name="share" className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-white/70">Saida (Saques)</span>
                </div>
                <span className="text-sm font-mono font-semibold text-red-400">-{formatCurrency(stats?.total_withdrawals ?? 0)}</span>
              </div>
              <div className="border-t border-white/10 pt-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Icon name="wallet" className="w-4 h-4 text-white/70" />
                    <span className="text-xs text-white/70 font-medium">Fluxo Liquido</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${netFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {netFlow >= 0 ? "+" : ""}{formatCurrency(netFlow)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unit Economics */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold mb-4">Unit Economics</h2>
          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Receita / Usuario", value: formatCurrency(avgRevPerUser), icon: "users" },
                { label: "Volume / Mercado", value: formatCurrency(avgVolPerMarket), icon: "bar-chart" },
                { label: "Taxa media (fee_rate)", value: "2.0%", icon: "zap" },
                { label: "Usuarios com saldo", value: String(stats?.users_with_balance ?? 0), icon: "wallet" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon} className="w-4 h-4 text-white/40" />
                    <span className="text-xs text-white/70">{item.label}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
