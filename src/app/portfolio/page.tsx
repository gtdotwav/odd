"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import OnboardingBanner from "@/components/OnboardingBanner";

interface Position {
  market_id: string;
  market_slug: string;
  market_title: string;
  side: "yes" | "no";
  quantity: number;
  avg_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
}

interface Order {
  id: string;
  market_slug: string;
  market_title: string;
  side: "yes" | "no";
  type: "market" | "limit";
  price: number;
  quantity: number;
  filled_quantity: number;
  status: "pending" | "partial" | "filled" | "cancelled";
  created_at: string;
}

function PositionRow({ p }: { p: Position }) {
  const isPositive = p.pnl >= 0;
  return (
    <Link
      href={`/mercado/${p.market_slug}`}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-raised transition-all"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text truncate">{p.market_title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            p.side === "yes" ? "bg-up/10 text-up" : "bg-down/10 text-down"
          }`}>
            {p.side === "yes" ? "Sim" : "Não"}
          </span>
          <span className="text-xs text-text-tertiary">{p.quantity} contratos</span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="text-right">
          <p className="text-text-tertiary">Preço médio</p>
          <p className="font-mono font-medium text-text">{formatCurrency(p.avg_price)}</p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Preço atual</p>
          <p className="font-mono font-medium text-text">{formatCurrency(p.current_price)}</p>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-text-tertiary">PnL</p>
          <p className={`font-mono font-semibold ${isPositive ? "text-up" : "text-down"}`}>
            {isPositive ? "+" : ""}{formatCurrency(p.pnl)}
            <span className="text-[10px] ml-1">({isPositive ? "+" : ""}{p.pnl_percent.toFixed(1)}%)</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function OrderRow({ order, onCancel }: { order: Order; onCancel?: (id: string) => void }) {
  const [cancelling, setCancelling] = useState(false);
  const canCancel = (order.status === "pending" || order.status === "partial") && onCancel;

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-accent/10 text-accent" },
    partial: { label: "Parcial", className: "bg-neutral-warn/15 text-neutral-warn" },
    filled: { label: "Executada", className: "bg-up/10 text-up" },
    cancelled: { label: "Cancelada", className: "bg-surface-raised text-text-tertiary" },
  };
  const status = statusConfig[order.status] ?? statusConfig.pending;

  async function handleCancel() {
    if (!onCancel) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Erro ao cancelar ordem");
        return;
      }
      toast.success("Ordem cancelada");
      onCancel(order.id);
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border border-border bg-surface">
      <div className="flex-1 min-w-0">
        <Link href={`/mercado/${order.market_slug}`} className="text-sm font-medium text-text hover:text-accent truncate block">
          {order.market_title}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.side === "yes" ? "bg-up/10 text-up" : "bg-down/10 text-down"
          }`}>
            {order.side === "yes" ? "Sim" : "Não"}
          </span>
          <span className="text-xs text-text-tertiary uppercase">{order.type}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="text-right">
          <p className="text-text-tertiary">Preço</p>
          <p className="font-mono font-medium text-text">{formatCurrency(order.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Qtd</p>
          <p className="font-mono font-medium text-text">
            {order.filled_quantity}/{order.quantity}
          </p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Total</p>
          <p className="font-mono font-medium text-text">{formatCurrency(order.price * order.quantity)}</p>
        </div>
        {canCancel && (
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancel}
            className="px-3 py-1.5 rounded-md border border-down/30 text-down text-[11px] font-medium hover:bg-down/10 transition-colors disabled:opacity-50"
          >
            {cancelling ? "..." : "Cancelar"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;
  const queryClient = useQueryClient();

  const handleCancelOrder = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  const { data: portfolioData, isLoading: loadingPortfolio } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => fetch("/api/portfolio").then((r) => r.json()),
    enabled: isSignedIn,
  });

  const { data: ordersData, isLoading: loadingOrders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetch("/api/orders").then((r) => r.json()),
    enabled: isSignedIn,
  });

  const isLoading = loadingPortfolio || loadingOrders;
  const positions: Position[] = portfolioData?.positions ?? [];
  const orders: Order[] = ordersData?.orders ?? [];

  const totalPnl = positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);
  const totalValue = positions.reduce((sum, p) => sum + (p.current_price ?? 0) * p.quantity, 0);
  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "partial");
  const historyOrders = orders.filter((o) => o.status === "filled" || o.status === "cancelled");

  if (!isSignedIn) {
    return (
      <div className="flex max-w-[1440px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <h1 className="text-xl font-bold text-text mb-6">Portfolio</h1>
          <EmptyState icon="bar-chart" title="Faça login" description="Entre na sua conta para ver seu portfolio." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <OnboardingBanner />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text">Portfolio</h1>
          <Link href="/carteira" className="text-sm text-accent hover:underline font-medium">
            Ver carteira
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-border bg-surface">
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : positions.length === 0 && orders.length === 0 ? (
          <EmptyState
            icon="bar-chart"
            title="Nenhuma posição ainda"
            description="Explore os mercados e faça sua primeira operação para ver suas posições aqui."
          />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-4 rounded-lg border border-border bg-surface">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Valor total</p>
                <p className="text-lg font-mono font-bold text-text">{formatCurrency(totalValue)}</p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-surface">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">PnL total</p>
                <p className={`text-lg font-mono font-bold ${totalPnl >= 0 ? "text-up" : "text-down"}`}>
                  {totalPnl >= 0 ? "+" : ""}{formatCurrency(totalPnl)}
                </p>
              </div>
              <div className="p-4 rounded-lg border border-border bg-surface">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Posições ativas</p>
                <p className="text-lg font-mono font-bold text-text">{positions.length}</p>
              </div>
            </div>

            {/* Positions */}
            {positions.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                  Minhas posições
                </h2>
                <div className="space-y-2">
                  {positions.map((p) => (
                    <PositionRow key={p.market_id} p={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Open orders */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Ordens abertas
              </h2>
              {openOrders.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4">Nenhuma ordem aberta.</p>
              ) : (
                <div className="space-y-2">
                  {openOrders.map((o) => (
                    <OrderRow key={o.id} order={o} onCancel={handleCancelOrder} />
                  ))}
                </div>
              )}
            </section>

            {/* History */}
            <section>
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Histórico
              </h2>
              {historyOrders.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4">Nenhuma ordem no histórico.</p>
              ) : (
                <div className="space-y-2">
                  {historyOrders.map((o) => (
                    <OrderRow key={o.id} order={o} onCancel={handleCancelOrder} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
