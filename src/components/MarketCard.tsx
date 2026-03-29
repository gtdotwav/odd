"use client";

import Link from "next/link";
import Icon, { categoryIcons } from "./Icon";
import type { Market } from "@/types/market";
import { formatVolume, formatVariation } from "@/lib/utils";

function StatusBadge({ status }: { status: Market["status"] }) {
  const config: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
    active: { bg: "bg-up/15", text: "text-up", label: "Ativo" },
    live: { bg: "bg-down/20", text: "text-down", label: "Ao vivo", pulse: true },
    closing: { bg: "bg-neutral-warn/15", text: "text-neutral-warn", label: "Fechando" },
    resolved_yes: { bg: "bg-up/15", text: "text-up", label: "Resolvido: Sim" },
    resolved_no: { bg: "bg-down/15", text: "text-down", label: "Resolvido: Não" },
  };
  const c = config[status] ?? config.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.bg} ${c.text}`}>
      {c.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-live" />}
      {status.startsWith("resolved") && <Icon name="check" className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

function ProbabilityBar({ yes, no }: { yes: number; no: number }) {
  const yesPct = Math.round(yes * 100);
  const noPct = Math.round(no * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-up">{yesPct}% Sim</span>
        <span className="text-down">{noPct}% Não</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-border">
        <div className="bg-up transition-all duration-500" style={{ width: `${yesPct}%` }} />
        <div className="bg-down transition-all duration-500" style={{ width: `${noPct}%` }} />
      </div>
    </div>
  );
}

export default function MarketCard({ market, featured = false }: { market: Market; featured?: boolean }) {
  const isResolved = market.status.startsWith("resolved");
  const catIcon = categoryIcons[market.category] || "trend-up";

  return (
    <Link
      href={`/mercado/${market.slug}`}
      className={`
        group block rounded-lg border border-border bg-surface
        hover:border-border-strong hover:bg-surface-raised hover:shadow-md hover:-translate-y-0.5
        transition-all duration-150
        ${featured ? "col-span-full" : ""}
        ${isResolved ? "opacity-75" : ""}
      `}
    >
      <div className={`p-4 ${featured ? "p-6" : ""}`}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            <Icon name={catIcon} className="w-3 h-3" />
            {market.category}
          </span>
          <StatusBadge status={market.status} />
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-text leading-snug mb-1 ${featured ? "text-xl" : "text-[15px]"}`}>
          {market.title}
        </h3>
        {market.subtitle && (
          <p className="text-xs text-text-secondary mb-3">{market.subtitle}</p>
        )}

        {/* Sport Scoreboard */}
        {market.sport && market.status === "live" && (
          <div className="bg-surface-raised rounded-md p-3 mb-3 text-center">
            <div className="flex items-center justify-center gap-4">
              <span className="font-semibold">{market.sport.home}</span>
              <span className="font-mono text-2xl font-bold">
                {market.sport.homeScore} <span className="text-text-tertiary">×</span> {market.sport.awayScore}
              </span>
              <span className="font-semibold">{market.sport.away}</span>
            </div>
            <span className="text-xs text-text-secondary">{market.sport.clock} · 2º tempo</span>
          </div>
        )}

        {/* Crypto Reference */}
        {market.crypto && (
          <div className="flex items-center gap-3 bg-surface-raised rounded-md p-2.5 mb-3 text-xs">
            <div>
              <span className="text-text-secondary">Meta: </span>
              <span className="font-mono font-semibold">${market.crypto.targetPrice.toLocaleString()}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div>
              <span className="text-text-secondary">{market.crypto.asset} agora: </span>
              <span className="font-mono font-semibold">${market.crypto.currentPrice.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Multi-outcome List */}
        {market.outcomes && market.type !== "sport" && (
          <div className="space-y-1.5 mb-3">
            {market.outcomes.slice(0, featured ? 5 : 3).map((o, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary w-4 text-right text-xs">{i + 1}.</span>
                <span className="flex-1 truncate">{o.label}</span>
                <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${o.probability * 100}%` }} />
                </div>
                <span className="font-mono text-xs font-medium w-8 text-right">{Math.round(o.probability * 100)}%</span>
              </div>
            ))}
            {market.outcomes.length > (featured ? 5 : 3) && (
              <span className="text-xs text-text-tertiary">+{market.outcomes.length - (featured ? 5 : 3)} opções</span>
            )}
          </div>
        )}

        {/* Probability Bar (binary) */}
        {market.type === "binary" && !isResolved && (
          <div className="mb-3">
            <ProbabilityBar yes={market.priceYes} no={market.priceNo} />
          </div>
        )}

        {/* Variation */}
        {!isResolved && market.variation24h !== 0 && (
          <div className="mb-3">
            <span className={`text-xs font-mono font-medium ${market.variation24h >= 0 ? "text-up" : "text-down"}`}>
              {formatVariation(market.variation24h)} hoje
            </span>
          </div>
        )}

        {/* Meta Row */}
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="font-mono">Vol {formatVolume(market.volume)}</span>
          <span className="text-border">·</span>
          <span>{isResolved ? `Resolvido ${market.resolutionDate}` : `Fecha ${market.resolutionDate}`}</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {market.commentCount >= 1000 ? `${(market.commentCount / 1000).toFixed(1)}K` : market.commentCount}
          </span>
        </div>

        {/* CTAs */}
        {!isResolved && market.type === "binary" && (
          <div className="flex gap-2 mt-3">
            <button type="button" className="flex-1 py-2 rounded-md bg-up/10 text-up text-sm font-semibold hover:bg-up/20 transition-colors">
              Sim R${market.priceYes.toFixed(2)}
            </button>
            <button type="button" className="flex-1 py-2 rounded-md bg-down/10 text-down text-sm font-semibold hover:bg-down/20 transition-colors">
              Não R${market.priceNo.toFixed(2)}
            </button>
          </div>
        )}

        {!isResolved && market.type !== "binary" && (
          <div className="mt-3">
            <span className="text-sm text-accent font-medium group-hover:underline">Ver mercado →</span>
          </div>
        )}

        {/* Featured Context */}
        {featured && market.context && (
          <p className="mt-3 text-xs text-text-secondary leading-relaxed border-t border-border pt-3">
            {market.context.slice(0, 200)}...
          </p>
        )}
      </div>
    </Link>
  );
}
