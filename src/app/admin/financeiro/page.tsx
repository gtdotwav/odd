"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface Transaction {
  id: string;
  user_name: string;
  user_handle: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  status: string;
  created_at: string;
}

interface FinancialStats {
  total_deposits: number;
  total_withdrawals: number;
  total_fees: number;
  net_revenue: number;
}

const TYPE_OPTIONS = [
  { value: "", label: "Todos os tipos" },
  { value: "deposit", label: "Deposito" },
  { value: "withdrawal", label: "Saque" },
  { value: "trade_buy", label: "Compra" },
  { value: "trade_sell", label: "Venda" },
  { value: "payout", label: "Pagamento" },
  { value: "fee", label: "Taxa" },
  { value: "refund", label: "Reembolso" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "completed", label: "Completa" },
  { value: "pending", label: "Pendente" },
  { value: "failed", label: "Falhou" },
  { value: "cancelled", label: "Cancelada" },
];

const typeBadge: Record<string, { className: string; label: string }> = {
  deposit: { className: "bg-up/15 text-up", label: "Deposito" },
  withdrawal: { className: "bg-down/15 text-down", label: "Saque" },
  trade_buy: { className: "bg-accent/15 text-accent", label: "Compra" },
  trade_sell: { className: "bg-highlight/15 text-highlight", label: "Venda" },
  payout: { className: "bg-up/15 text-up", label: "Pagamento" },
  fee: { className: "bg-neutral-warn/15 text-neutral-warn", label: "Taxa" },
  refund: { className: "bg-surface-raised text-text-secondary", label: "Reembolso" },
};

const PAGE_SIZE = 20;

export default function AdminFinanceiro() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [financialStats, setFinancialStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/financeiro?${params.toString()}`);
    },
    [searchParams, router],
  );

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error("Erro ao carregar estatisticas");
        const data = await res.json();
        const s = data.stats;
        setFinancialStats({
          total_deposits: s?.total_deposits ?? 0,
          total_withdrawals: s?.total_withdrawals ?? 0,
          total_fees: s?.total_fees ?? 0,
          net_revenue: s?.net_revenue ?? 0,
        });
      } catch {
        // Stats are optional, don't block the page
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Fetch transactions
  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (status) params.set("status", status);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String((page - 1) * PAGE_SIZE));

        const res = await fetch(`/api/admin/transactions?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao carregar transacoes");
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [type, status, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const summaryCards = [
    { label: "Depositos", value: financialStats?.total_deposits ?? 0, icon: "download", color: "text-up", bgColor: "bg-up/10" },
    { label: "Saques", value: financialStats?.total_withdrawals ?? 0, icon: "upload", color: "text-down", bgColor: "bg-down/10" },
    { label: "Taxas", value: financialStats?.total_fees ?? 0, icon: "wallet", color: "text-neutral-warn", bgColor: "bg-neutral-warn/10" },
    { label: "Receita Liquida", value: financialStats?.net_revenue ?? 0, icon: "trend-up", color: "text-accent", bgColor: "bg-accent/10" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-text">Financeiro</h1>
        <p className="text-sm text-text-secondary mt-0.5">Visao geral de depositos, saques e taxas</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-4">
            {statsLoading ? (
              <div>
                <Skeleton className="w-8 h-8 rounded-full mb-2" />
                <Skeleton className="h-6 w-20 mb-1" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ) : (
              <div>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-2", card.bgColor)}>
                  <Icon name={card.icon} className={cn("w-4 h-4", card.color)} />
                </div>
                <p className="text-lg font-bold font-mono text-text">{formatCurrency(card.value)}</p>
                <p className="text-xs text-text-secondary mt-0.5">{card.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={type}
          onChange={(e) => updateParams({ type: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          {STATUS_OPTIONS.map((opt) => (
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
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-[2]" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon="wallet"
            title="Nenhuma transacao encontrada"
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
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Tipo</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Valor</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Saldo Apos</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Descricao</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="pb-3 pt-4 pr-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const tBadge = typeBadge[tx.type] || { className: "bg-surface-raised text-text-secondary", label: tx.type };
                    const isPositive = tx.amount >= 0;
                    return (
                      <tr key={tx.id} className="hover:bg-surface-raised transition-colors">
                        <td className="py-3 px-5">
                          <p className="font-medium text-text text-xs">{tx.user_name || "Sistema"}</p>
                          {tx.user_handle && (
                            <p className="text-[11px] text-text-tertiary">@{tx.user_handle}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", tBadge.className)}>
                            {tBadge.label}
                          </span>
                        </td>
                        <td className={cn("py-3 pr-4 text-right font-mono text-xs font-medium", isPositive ? "text-up" : "text-down")}>
                          {isPositive ? "+" : ""}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-xs text-text-secondary">
                          {formatCurrency(tx.balance_after)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-text-secondary max-w-[200px] truncate">
                          {tx.description || "-"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-xs font-medium",
                            tx.status === "completed" ? "bg-up/15 text-up" :
                            tx.status === "pending" ? "bg-neutral-warn/15 text-neutral-warn" :
                            tx.status === "failed" ? "bg-down/15 text-down" :
                            "bg-surface-raised text-text-tertiary"
                          )}>
                            {tx.status === "completed" ? "Completa" :
                             tx.status === "pending" ? "Pendente" :
                             tx.status === "failed" ? "Falhou" :
                             tx.status === "cancelled" ? "Cancelada" : tx.status}
                          </span>
                        </td>
                        <td className="py-3 pr-5 text-xs text-text-secondary">
                          {formatDate(tx.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-border">
              {transactions.map((tx) => {
                const tBadge = typeBadge[tx.type] || { className: "bg-surface-raised text-text-secondary", label: tx.type };
                const isPositive = tx.amount >= 0;
                return (
                  <div key={tx.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text">{tx.user_name || "Sistema"}</p>
                        {tx.description && (
                          <p className="text-xs text-text-secondary truncate">{tx.description}</p>
                        )}
                      </div>
                      <p className={cn("text-sm font-mono font-medium shrink-0", isPositive ? "text-up" : "text-down")}>
                        {isPositive ? "+" : ""}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full font-medium", tBadge.className)}>
                        {tBadge.label}
                      </span>
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-full font-medium",
                        tx.status === "completed" ? "bg-up/15 text-up" :
                        tx.status === "pending" ? "bg-neutral-warn/15 text-neutral-warn" :
                        "bg-surface-raised text-text-tertiary"
                      )}>
                        {tx.status === "completed" ? "Completa" :
                         tx.status === "pending" ? "Pendente" :
                         tx.status === "failed" ? "Falhou" : tx.status}
                      </span>
                      <span className="text-text-tertiary">{formatDate(tx.created_at)}</span>
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
            {total} transac{total !== 1 ? "oes" : "ao"} no total
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
