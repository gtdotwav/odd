"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";

interface Market {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  price_yes: number;
  price_no: number;
  volume: number;
  variation_24h: number;
  comment_count: number;
  pool_yes: number;
  pool_no: number;
  fee_rate: number;
  resolution_date: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-400" },
  live: { label: "Ao Vivo", className: "bg-blue-500/15 text-blue-400" },
  closing: { label: "Fechando", className: "bg-amber-500/15 text-amber-400" },
  resolved: { label: "Resolvido", className: "bg-white/10 text-white/50" },
  disputed: { label: "Disputado", className: "bg-red-500/15 text-red-400" },
};

export default function TenantMercados() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("volume");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    params.set("sort", sort);
    params.set("limit", "50");

    fetch(`/api/tenant/markets?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMarkets(data.markets ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [filter, sort]);

  const totalVolume = markets.reduce((sum, m) => sum + (m.volume ?? 0), 0);
  const avgPool = markets.length > 0
    ? markets.reduce((sum, m) => sum + (m.pool_yes ?? 0) + (m.pool_no ?? 0), 0) / markets.length
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Mercados</h1>
          <p className="text-sm text-white/50 mt-0.5">{total} mercados no total</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Volume Total</p>
          <p className="text-lg font-mono font-bold">{formatCurrency(totalVolume)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Pool Medio</p>
          <p className="text-lg font-mono font-bold">{formatCurrency(avgPool)}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Exibindo</p>
          <p className="text-lg font-mono font-bold">{markets.length} / {total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 overflow-x-auto pb-2">
        {["", "active", "live", "closing", "resolved", "disputed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === s ? "bg-highlight text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {s === "" ? "Todos" : statusConfig[s]?.label ?? s}
          </button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70"
        >
          <option value="volume">Volume</option>
          <option value="newest">Mais novos</option>
          <option value="variation">Variacao</option>
        </select>
      </div>

      {/* Market list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="bar-chart" className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">Nenhum mercado encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {markets.map((m) => {
            const status = statusConfig[m.status] ?? statusConfig.active;
            return (
              <div key={m.id} className="flex items-center gap-4 p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/[0.07] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="text-[10px] text-white/40">{m.category}</span>
                    <span className="text-[10px] text-white/30">{m.comment_count} comentarios</span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-xs shrink-0">
                  <div className="text-right">
                    <p className="text-white/40">Preco Sim</p>
                    <p className="font-mono font-semibold text-emerald-400">{(m.price_yes * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Volume</p>
                    <p className="font-mono font-semibold">{formatCurrency(m.volume)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Var 24h</p>
                    <p className={`font-mono font-semibold ${m.variation_24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {m.variation_24h >= 0 ? "+" : ""}{(m.variation_24h * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-white/40">Pool</p>
                    <p className="font-mono font-semibold">{formatCurrency((m.pool_yes ?? 0) + (m.pool_no ?? 0))}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
