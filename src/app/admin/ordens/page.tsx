"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Order {
  id: string;
  user_name: string;
  user_handle: string;
  market_title: string;
  market_id: string;
  side: string;
  type: string;
  price: number;
  quantity: number;
  filled_quantity: number;
  status: string;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "partial", label: "Parcial" },
  { value: "filled", label: "Preenchida" },
  { value: "cancelled", label: "Cancelada" },
];

const SIDE_OPTIONS = [
  { value: "", label: "Todos os lados" },
  { value: "yes", label: "Sim" },
  { value: "no", label: "Nao" },
];

const statusBadge: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-neutral-warn/15 text-neutral-warn", label: "Pendente" },
  partial: { className: "bg-accent/15 text-accent", label: "Parcial" },
  filled: { className: "bg-up/15 text-up", label: "Preenchida" },
  cancelled: { className: "bg-surface-raised text-text-tertiary", label: "Cancelada" },
};

const PAGE_SIZE = 20;

export default function AdminOrdens() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const status = searchParams.get("status") || "";
  const side = searchParams.get("side") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/ordens?${params.toString()}`);
    },
    [searchParams, router],
  );

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (side) params.set("side", side);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String((page - 1) * PAGE_SIZE));

        const res = await fetch(`/api/admin/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao carregar ordens");
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [status, side, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Ordens</h1>
        <p className="text-sm text-text-secondary mt-0.5">Monitoramento de ordens do book de ofertas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={side}
          onChange={(e) => updateParams({ side: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {SIDE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-down/10 border border-down/20 text-sm text-down">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 flex-[2]" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon="zap"
            title="Nenhuma ordem encontrada"
            description="Tente alterar os filtros de busca."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pt-4 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Usuario</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Mercado</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Lado</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tipo</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Preco</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Qtd</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Preenchido</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="pb-3 pt-4 pr-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => {
                    const badge = statusBadge[order.status] || statusBadge.pending;
                    return (
                      <tr key={order.id} className="hover:bg-surface-raised transition-colors">
                        <td className="py-3 px-5">
                          <p className="font-medium text-text text-xs">{order.user_name || "Anonimo"}</p>
                          <p className="text-[11px] text-text-tertiary">@{order.user_handle}</p>
                        </td>
                        <td className="py-3 pr-4 max-w-[200px]">
                          <p className="text-text truncate text-xs">{order.market_title}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                            order.side === "yes" ? "bg-up/15 text-up" : "bg-down/15 text-down"
                          )}>
                            {order.side === "yes" ? "Sim" : "Nao"}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary text-xs capitalize">
                          {order.type === "limit" ? "Limite" : order.type === "market" ? "Mercado" : order.type}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary text-xs">
                          {formatCurrency(order.price)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary text-xs">
                          {order.quantity}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary text-xs">
                          {order.filled_quantity}/{order.quantity}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", badge.className)}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 pr-5 text-xs text-text-secondary">
                          {formatDate(order.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border">
              {orders.map((order) => {
                const badge = statusBadge[order.status] || statusBadge.pending;
                return (
                  <div key={order.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{order.market_title}</p>
                        <p className="text-xs text-text-secondary">{order.user_name || "Anonimo"} (@{order.user_handle})</p>
                      </div>
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium shrink-0", badge.className)}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full font-medium",
                        order.side === "yes" ? "bg-up/15 text-up" : "bg-down/15 text-down"
                      )}>
                        {order.side === "yes" ? "Sim" : "Nao"}
                      </span>
                      <span className="font-mono">{formatCurrency(order.price)}</span>
                      <span className="font-mono">{order.filled_quantity}/{order.quantity}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-text-tertiary">
            {total} ordem{total !== 1 ? "ns" : ""} no total
          </p>
          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="h-8 px-3 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="px-2 text-xs text-text-secondary">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="h-8 px-3 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
