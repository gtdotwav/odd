"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import MarketCard from "@/components/MarketCard";
import type { Market } from "@/types/market";

const tabs = ["Todos", "Novos", "Em alta", "Popular", "Líquido", "Fechando", "Disputado", "Brasil"];
const tabValues = ["all", "new", "trending", "popular", "liquid", "closing", "disputed", "brazil"];
const categories = ["Todas", "Futebol", "Política", "Economia", "Cultura Pop", "Cripto", "Esportes", "Mundo", "Tech / IA"];
const sorts = [
  { value: "relevance", label: "Relevância" },
  { value: "volume", label: "Volume" },
  { value: "variation", label: "Variação" },
  { value: "resolution", label: "Resolução" },
  { value: "newest", label: "Mais recentes" },
];

interface Props {
  initialMarkets: Market[];
  total: number;
  activeCategory?: string;
  activeTab?: string;
  activeSort?: string;
  activeSearch?: string;
}

export default function MarketGrid({ initialMarkets, total, activeCategory, activeTab, activeSort = "relevance", activeSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all" && value !== "Todas") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      router.push(`/explorar?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab, i) => {
          const value = tabValues[i];
          const isActive = (activeTab || "all") === value;
          return (
            <button
              key={tab}
              onClick={() => updateParams({ tab: value })}
              className={`shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text hover:bg-surface-raised"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <span className="text-xs text-text-tertiary shrink-0">Categoria:</span>
        {categories.map((cat) => {
          const isActive = (activeCategory || "Todas") === cat;
          return (
            <button
              key={cat}
              onClick={() => updateParams({ category: cat })}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isActive
                  ? "border-accent/30 bg-accent/10 text-accent"
                  : "border-border text-text-secondary hover:border-border-strong hover:text-text"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Count + sort */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-text-secondary">{total} mercados encontrados</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-tertiary">Ordenar:</span>
          <select
            value={activeSort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="bg-surface border border-border rounded-md px-2 py-1 text-xs text-text-secondary"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          defaultValue={activeSearch}
          placeholder="Buscar mercados..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParams({ search: (e.target as HTMLInputElement).value || undefined });
            }
          }}
          className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-text placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {/* Grid */}
      {initialMarkets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">Nenhum mercado encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {initialMarkets.map((m) => (
            <MarketCard key={m.id} market={m} />
          ))}
        </div>
      )}
    </>
  );
}
