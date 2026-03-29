"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, cn } from "@/lib/utils";

interface Market {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  volume: number;
  yes_price: number;
  resolution_date: string | null;
  featured: boolean;
}

const CATEGORIES = ["Economia", "Futebol", "Politica", "Cultura Pop", "Cripto", "Esportes", "Mundo", "Tech / IA"];

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "active", label: "Ativo" },
  { value: "live", label: "Ao vivo" },
  { value: "closing", label: "Fechando" },
  { value: "resolved_yes", label: "Resolvido Sim" },
  { value: "resolved_no", label: "Resolvido Nao" },
  { value: "disputed", label: "Disputado" },
  { value: "cancelled", label: "Cancelado" },
];

const statusBadge: Record<string, { className: string; label: string }> = {
  draft: { className: "bg-surface-raised text-text-secondary", label: "Rascunho" },
  active: { className: "bg-up/15 text-up", label: "Ativo" },
  live: { className: "bg-down/20 text-down", label: "Ao vivo" },
  closing: { className: "bg-neutral-warn/15 text-neutral-warn", label: "Fechando" },
  resolved_yes: { className: "bg-up/15 text-up", label: "Resolvido Sim" },
  resolved_no: { className: "bg-down/15 text-down", label: "Resolvido Nao" },
  disputed: { className: "bg-neutral-warn/15 text-neutral-warn", label: "Disputado" },
  cancelled: { className: "bg-surface-raised text-text-tertiary", label: "Cancelado" },
};

const PAGE_SIZE = 20;

export default function AdminMercados() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const status = searchParams.get("status") || "";
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      if (updates.page === undefined && !("page" in updates)) params.delete("page");
      router.push(`/admin/mercados?${params.toString()}`);
    },
    [searchParams, router],
  );

  useEffect(() => {
    async function fetchMarkets() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (category) params.set("category", category);
        if (search) params.set("search", search);
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String((page - 1) * PAGE_SIZE));

        const res = await fetch(`/api/admin/markets?${params.toString()}`);
        if (!res.ok) throw new Error("Erro ao carregar mercados");
        const data = await res.json();
        setMarkets(data.markets || []);
        setTotal(data.total || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
  }, [status, category, search, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const canResolve = (s: string) => ["active", "live", "closing", "disputed"].includes(s);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-text">Mercados</h1>
        <Link
          href="/admin/mercados/novo"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          Novo Mercado
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Buscar mercados..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: "" })}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
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
          value={category}
          onChange={(e) => updateParams({ category: e.target.value, page: "" })}
          className="h-9 px-3 rounded-lg border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 flex-[3]" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : markets.length === 0 ? (
          <EmptyState
            icon="bar-chart"
            title="Nenhum mercado encontrado"
            description="Tente alterar os filtros ou crie um novo mercado."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 pt-4 px-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Titulo</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Categoria</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Volume</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Preco Sim</th>
                    <th className="pb-3 pt-4 pr-4 text-xs font-semibold text-text-tertiary uppercase tracking-wider">Resolucao</th>
                    <th className="pb-3 pt-4 pr-5 text-xs font-semibold text-text-tertiary uppercase tracking-wider text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {markets.map((market) => {
                    const badge = statusBadge[market.status] || statusBadge.draft;
                    return (
                      <tr key={market.id} className="hover:bg-surface-raised transition-colors">
                        <td className="py-3 px-5 max-w-[300px]">
                          <p className="font-medium text-text truncate">{market.title}</p>
                          {market.featured && (
                            <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-highlight">
                              <Icon name="star" className="w-3 h-3" /> Destaque
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">{market.category}</td>
                        <td className="py-3 pr-4">
                          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", badge.className)}>
                            {market.status === "live" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-down animate-pulse-live" />
                            )}
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary">
                          {formatCurrency(market.volume)}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-text-secondary">
                          {(market.yes_price * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 pr-4 text-text-secondary text-xs">
                          {market.resolution_date
                            ? new Date(market.resolution_date).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/mercados/${market.id}`}
                              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised transition-colors"
                            >
                              <Icon name="settings" className="w-3.5 h-3.5" />
                              Editar
                            </Link>
                            {canResolve(market.status) && (
                              <Link
                                href={`/admin/mercados/${market.id}#resolver`}
                                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-up/30 text-xs font-medium text-up hover:bg-up/10 transition-colors"
                              >
                                <Icon name="check" className="w-3.5 h-3.5" />
                                Resolver
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {markets.map((market) => {
                const badge = statusBadge[market.status] || statusBadge.draft;
                return (
                  <div key={market.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-text flex-1">{market.title}</p>
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0", badge.className)}>
                        {market.status === "live" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-down animate-pulse-live" />
                        )}
                        {badge.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                      <span>{market.category}</span>
                      <span className="font-mono">{formatCurrency(market.volume)}</span>
                      <span className="font-mono">{(market.yes_price * 100).toFixed(0)}% Sim</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/admin/mercados/${market.id}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border text-xs font-medium text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        <Icon name="settings" className="w-3.5 h-3.5" />
                        Editar
                      </Link>
                      {canResolve(market.status) && (
                        <Link
                          href={`/admin/mercados/${market.id}#resolver`}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-up/30 text-xs font-medium text-up hover:bg-up/10 transition-colors"
                        >
                          <Icon name="check" className="w-3.5 h-3.5" />
                          Resolver
                        </Link>
                      )}
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
            {total} mercado{total !== 1 ? "s" : ""} no total
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
