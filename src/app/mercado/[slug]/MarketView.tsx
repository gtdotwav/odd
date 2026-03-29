"use client";

import { useState } from "react";
import Icon, { categoryIcons } from "@/components/Icon";
import ProbChart from "@/components/ProbChart";
import type { MarketDetail } from "@/types/market";
import { formatVolume, formatVariation } from "@/lib/utils";
import Link from "next/link";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100000;

function TradeTicket({ market }: { market: MarketDetail }) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const price = side === "yes" ? market.priceYes : market.priceNo;
  const numAmount = parseFloat(amount) || 0;
  const qty = numAmount > 0 ? Math.floor(numAmount / price) : 0;
  const payout = qty * 1;
  const profit = payout - numAmount;
  const profitPct = numAmount > 0 ? (profit / numAmount) * 100 : 0;

  const tooLow = numAmount > 0 && numAmount < MIN_AMOUNT;
  const tooHigh = numAmount > MAX_AMOUNT;
  const validAmount = numAmount >= MIN_AMOUNT && numAmount <= MAX_AMOUNT;
  const error = tooLow ? `Mínimo R$ ${MIN_AMOUNT}` : tooHigh ? `Máximo R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}` : null;

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Negociar</h3>

      <div className="flex rounded-md border border-border overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setSide("yes")}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            side === "yes" ? "bg-up/15 text-up" : "text-text-secondary hover:bg-surface-raised"
          }`}
        >
          Sim R${market.priceYes.toFixed(2)}
        </button>
        <button
          type="button"
          onClick={() => setSide("no")}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            side === "no" ? "bg-down/15 text-down" : "text-text-secondary hover:bg-surface-raised"
          }`}
        >
          Não R${market.priceNo.toFixed(2)}
        </button>
      </div>

      <label className="block text-xs text-text-secondary mb-1.5">Valor</label>
      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">R$</span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00"
          className={`w-full pl-9 pr-3 py-2.5 rounded-md border bg-surface-raised text-text font-mono text-sm focus:outline-none transition-colors ${
            error ? "border-down focus:border-down" : "border-border focus:border-accent"
          }`}
        />
      </div>
      {error && <p className="text-[11px] text-down -mt-2 mb-3">{error}</p>}

      <div className="flex gap-2 mb-4">
        {["20", "50", "100", "200"].map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => setAmount(v)}
            className="flex-1 py-1.5 rounded text-xs font-medium border border-border text-text-secondary hover:border-border-strong hover:text-text transition-colors"
          >
            R${v}
          </button>
        ))}
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="space-y-2 mb-4 p-3 rounded-md bg-surface-raised text-xs">
          <div className="flex justify-between">
            <span className="text-text-secondary">Preço</span>
            <span className="font-mono text-text">R$ {price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Quantidade</span>
            <span className="font-mono text-text">{qty} contratos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Retorno se {side === "yes" ? "Sim" : "Não"}</span>
            <span className="font-mono text-up">R$ {payout.toFixed(2)} (+{profitPct.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Risco máximo</span>
            <span className="font-mono text-text">R$ {parseFloat(amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Taxa estimada</span>
            <span className="font-mono text-text">R$ {(parseFloat(amount) * 0.02).toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={!validAmount}
        className="w-full py-2.5 rounded-md bg-highlight hover:bg-highlight-hover disabled:bg-surface-raised disabled:text-text-tertiary text-white font-semibold text-sm transition-colors"
      >
        {!amount ? "Insira um valor" : !validAmount ? "Valor inválido" : `Comprar ${side === "yes" ? "Sim" : "Não"} · R$ ${numAmount.toFixed(2)}`}
      </button>

      <button type="button" className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors">
        <Icon name="settings" className="w-3.5 h-3.5" />
        Oferta com preço (ordem limite)
      </button>
    </div>
  );
}

const MAX_COMMENT_LENGTH = 500;

function CommentInput() {
  const [text, setText] = useState("");
  const remaining = MAX_COMMENT_LENGTH - text.length;
  const overLimit = remaining < 0;

  return (
    <div className="mt-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="O que você acha desse mercado?"
          rows={2}
          className={`w-full px-3 py-2.5 rounded-md border bg-surface-raised text-sm text-text placeholder:text-text-tertiary focus:outline-none transition-colors resize-none ${
            overLimit ? "border-down focus:border-down" : "border-border focus:border-accent"
          }`}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className={`text-[10px] font-mono ${overLimit ? "text-down" : remaining < 50 ? "text-neutral-warn" : "text-text-tertiary"}`}>
          {remaining}
        </span>
        <button
          type="button"
          disabled={!text.trim() || overLimit}
          className="px-3 py-1 rounded-md bg-accent text-white text-xs font-semibold disabled:bg-surface-raised disabled:text-text-tertiary transition-colors"
        >
          Comentar
        </button>
      </div>
    </div>
  );
}

function Comments({ marketId }: { marketId: string }) {
  // TODO: fetch from /api/comments?market_id=...
  const comments = [
    { handle: "@ana_macro", badge: "Top 5% Macro", badgeIcon: "building", text: "Dados de emprego da semana passada reforçam tese hawkish. IPCA-15 veio acima do consenso. Difícil ver BCB segurando.", likes: 42, time: "2h" },
    { handle: "@selic_bear", badge: "Analista", badgeIcon: "trend-up", text: "Mercado de DI já precifica 85% de alta de 50bps. A questão é se será 50 ou 75.", likes: 28, time: "4h" },
    { handle: "@joao_trader", badge: "", badgeIcon: "", text: "Comprei Sim a 0,65, não pretendo vender antes da decisão. Convicção alta.", likes: 15, time: "8h" },
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Comentários</h3>
        <div className="flex gap-1">
          <button type="button" className="px-2 py-1 rounded text-xs font-medium bg-accent/10 text-accent">Relevantes</button>
          <button type="button" className="px-2 py-1 rounded text-xs font-medium text-text-tertiary hover:text-text-secondary">Recentes</button>
        </div>
      </div>

      <div className="space-y-4">
        {comments.map((c, i) => (
          <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold">
                {c.handle[1].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-accent">{c.handle}</span>
              {c.badge && (
                <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                  <Icon name={c.badgeIcon} className="w-3 h-3 opacity-50" />
                  {c.badge}
                </span>
              )}
              <span className="text-[10px] text-text-tertiary ml-auto">{c.time}</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed ml-8">{c.text}</p>
            <div className="flex items-center gap-3 mt-2 ml-8">
              <button type="button" className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary">
                <Icon name="thumbs-up" className="w-3 h-3" />
                {c.likes}
              </button>
              <button type="button" className="text-xs text-text-tertiary hover:text-text-secondary">Responder</button>
            </div>
          </div>
        ))}
      </div>

      <CommentInput />
    </div>
  );
}

export default function MarketView({ market }: { market: MarketDetail }) {
  const isResolved = market.status.startsWith("resolved");
  const catIcon = categoryIcons[market.category] || "trend-up";

  return (
    <>
      {/* Hero */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
            <Icon name={catIcon} className="w-3 h-3" />
            {market.category}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            isResolved ? "bg-up/15 text-up" : market.status === "live" ? "bg-down/20 text-down" : "bg-up/15 text-up"
          }`}>
            {isResolved && <Icon name="check" className="w-3 h-3" />}
            {market.status === "live" && <span className="w-1.5 h-1.5 rounded-full bg-down animate-pulse-live" />}
            {isResolved ? "Resolvido" : market.status === "live" ? "Ao vivo" : "Ativo"}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text mb-2">{market.title}</h1>
        {market.subtitle && <p className="text-sm text-text-secondary mb-3">{market.subtitle}</p>}

        <div className="flex items-center gap-4 text-xs text-text-secondary">
          <span className="font-mono">Vol {formatVolume(market.volume)}</span>
          <span>Spread 1%</span>
          <span>{isResolved ? "Resolvido" : "Resolve"}: {market.resolutionDate}</span>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:text-text hover:border-border-strong transition-colors">
            <Icon name="star" className="w-3.5 h-3.5" />
            Seguir
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:text-text hover:border-border-strong transition-colors">
            <Icon name="bell" className="w-3.5 h-3.5" />
            Alertar
          </button>
          <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:text-text hover:border-border-strong transition-colors">
            <Icon name="share" className="w-3.5 h-3.5" />
            Compartilhar
          </button>
        </div>
      </div>

      {/* Resolved Banner */}
      {isResolved && (
        <div className="mb-5 p-4 rounded-lg border border-up/30 bg-up/5">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="check" className="w-5 h-5 text-up" />
            <span className="font-semibold text-up">Resolvido: {market.status === "resolved_yes" ? "Sim" : "Não"}</span>
          </div>
          <p className="text-xs text-text-secondary">
            Fonte: {market.source || "—"}
          </p>
          <button type="button" className="mt-3 px-4 py-2 rounded-md bg-up/10 text-up text-sm font-semibold hover:bg-up/20 transition-colors">
            Resgatar ganhos →
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-5">
          {!isResolved && (
            <ProbChart
              currentPrice={market.priceYes}
              priceHistory={market.priceHistory}
            />
          )}

          {market.outcomes && market.outcomes.length > 0 && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-3">Opções</h3>
              <div className="space-y-2">
                {market.outcomes.map((o, i) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                    <span className="text-xs text-text-tertiary w-5 text-right">{i + 1}.</span>
                    <span className="flex-1 text-sm font-medium">{o.label}</span>
                    <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${o.probability * 100}%` }} />
                    </div>
                    <span className="font-mono text-sm font-medium w-10 text-right">{Math.round(o.probability * 100)}%</span>
                    <button type="button" className="px-3 py-1 rounded text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                      Comprar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Regras deste mercado</h3>
            {market.rules && <p className="text-sm text-text-secondary leading-relaxed mb-3">{market.rules}</p>}
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex gap-2">
                <span className="text-text-tertiary shrink-0">Fonte:</span>
                <span className="text-accent">{market.source || "A definir"}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-tertiary shrink-0">Resolução:</span>
                <span>{market.resolutionDate}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-text-tertiary shrink-0">Contestação:</span>
                <span>48h após resolução</span>
              </div>
            </div>
          </div>

          {/* Context */}
          {market.context && (
            <div className="bg-surface rounded-lg border border-border p-4">
              <h3 className="text-sm font-semibold mb-2">O que move esse mercado</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{market.context}</p>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-text-tertiary">
                <Icon name="sparkle" className="w-3 h-3 opacity-60" />
                <span>Resumo Odd · Atualizado há 2h</span>
                <span className="flex items-center gap-1 text-amber-400/70">
                  <Icon name="alert-triangle" className="w-3 h-3" />
                  Resumo assistido por IA
                </span>
              </div>
            </div>
          )}

          <Comments marketId={market.id} />

          {/* Transparency */}
          <div className="bg-surface rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold mb-3">Transparência</h3>
            <div className="space-y-2 text-xs">
              <p className="text-text-tertiary uppercase tracking-wider mb-2">Top holders</p>
              {[
                { handle: "@macro_king", amount: "R$ 50K", side: "Sim" },
                { handle: "@selic_watcher", amount: "R$ 38K", side: "Sim" },
                { handle: "@bear_trader", amount: "R$ 22K", side: "Não" },
              ].map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-text-secondary">
                  <span className="w-4 text-right text-text-tertiary">{i + 1}.</span>
                  <span className="text-accent">{h.handle}</span>
                  <span className="flex-1" />
                  <span className="font-mono">{h.amount}</span>
                  <span className={h.side === "Sim" ? "text-up" : "text-down"}>{h.side}</span>
                </div>
              ))}
              <p className="text-text-tertiary mt-2">Top 3 = 22% do volume total</p>
            </div>
          </div>
        </div>

        {!isResolved && (
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-20">
              <TradeTicket market={market} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
