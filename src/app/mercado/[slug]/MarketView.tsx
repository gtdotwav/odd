"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Icon, { categoryIcons } from "@/components/Icon";
import ProbChart from "@/components/ProbChart";
import type { MarketDetail } from "@/types/market";
import { formatVolume, formatVariation, formatRelativeTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 100000;

interface TradeQuote {
  shares: number;
  payout: number;
  cost: number;
  fee: number;
  avgPrice: number;
  priceImpact: number;
  newPriceYes: number;
  newPriceNo: number;
  currentPriceYes: number;
  currentPriceNo: number;
  error?: string;
  message?: string;
}

function TradeTicket({ market }: { market: MarketDetail }) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quote, setQuote] = useState<TradeQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const queryClient = useQueryClient();

  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  // Fetch wallet balance
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => fetch("/api/wallet").then((r) => r.json()),
    enabled: isSignedIn,
    staleTime: 10 * 1000,
  });
  const balance = walletData?.balance ?? 0;

  // Fetch user positions for this market
  const { data: portfolioData } = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => fetch("/api/portfolio").then((r) => r.json()),
    enabled: isSignedIn,
    staleTime: 10 * 1000,
  });
  const positions = (portfolioData?.positions ?? []) as Array<{
    market_id: string;
    side: string;
    quantity: number;
  }>;
  const myPosition = positions.find(
    (p) => p.market_id === market.id && p.side === side,
  );
  const myShares = myPosition?.quantity ?? 0;

  const numAmount = parseFloat(amount) || 0;
  const tooLow = numAmount > 0 && numAmount < MIN_AMOUNT;
  const tooHigh = numAmount > MAX_AMOUNT;
  const insufficientBalance = action === "buy" && numAmount > 0 && numAmount > balance && isSignedIn;
  const insufficientShares = action === "sell" && numAmount > 0 && numAmount > myShares && isSignedIn;
  const validAmount =
    numAmount >= MIN_AMOUNT &&
    numAmount <= MAX_AMOUNT &&
    !insufficientBalance &&
    !insufficientShares;
  const error = tooLow
    ? `Mínimo R$ ${MIN_AMOUNT}`
    : tooHigh
    ? `Máximo R$ ${MAX_AMOUNT.toLocaleString("pt-BR")}`
    : insufficientBalance
    ? "Saldo insuficiente"
    : insufficientShares
    ? `Você tem ${myShares.toFixed(1)} contratos`
    : null;

  // Reset amount when switching action
  useEffect(() => {
    setAmount("");
    setQuote(null);
  }, [action]);

  // Fetch quote when amount/side/action changes (debounced)
  const fetchQuote = useCallback(async (s: string, act: string, a: number) => {
    if (a < MIN_AMOUNT) { setQuote(null); return; }
    setQuoteLoading(true);
    try {
      const res = await fetch(
        `/api/markets/${market.slug}/trade?side=${s}&action=${act}&amount=${a}`
      );
      const data = await res.json();
      if (data.error) {
        setQuote(null);
      } else {
        setQuote(data);
      }
    } catch {
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [market.slug]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (numAmount >= MIN_AMOUNT) {
        fetchQuote(side, action, numAmount);
      } else {
        setQuote(null);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [side, action, numAmount, fetchQuote]);

  const handleTrade = async () => {
    if (!isSignedIn) {
      toast.error("Faça login para negociar");
      return;
    }
    if (!validAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/markets/${market.slug}/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ side, action, amount: numAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message || data.error || "Erro ao executar trade";
        if (data.error === "insufficient_balance") {
          toast.error("Saldo insuficiente. Deposite para continuar.", {
            action: { label: "Depositar", onClick: () => window.location.href = "/carteira" },
          });
        } else if (data.error === "insufficient_position") {
          toast.error("Contratos insuficientes para vender.");
        } else {
          toast.error(msg);
        }
      } else {
        if (action === "buy") {
          toast.success(`Comprou ${data.shares?.toFixed(1) ?? ""} contratos ${side === "yes" ? "Sim" : "Não"}`);
        } else {
          toast.success(`Vendeu ${numAmount.toFixed(1)} contratos por ${formatCurrency(data.payout ?? 0)}`);
        }
        setAmount("");
        setQuote(null);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const payout = action === "buy" ? (quote?.shares ?? 0) : (quote?.payout ?? 0);
  const profit = action === "buy" ? payout - numAmount : payout;
  const profitPct = numAmount > 0 && action === "buy" ? (profit / numAmount) * 100 : 0;

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Negociar</h3>
        {isSignedIn && (
          <Link href="/carteira" className="text-[11px] text-text-tertiary hover:text-accent transition-colors font-mono">
            Saldo: {formatCurrency(balance)}
          </Link>
        )}
      </div>

      {/* Buy/Sell tabs */}
      <div className="flex rounded-md border border-border overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => setAction("buy")}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
            action === "buy" ? "bg-up/15 text-up" : "text-text-secondary hover:bg-surface-raised"
          }`}
        >
          Comprar
        </button>
        <button
          type="button"
          onClick={() => setAction("sell")}
          className={`flex-1 py-1.5 text-xs font-semibold transition-colors ${
            action === "sell" ? "bg-down/15 text-down" : "text-text-secondary hover:bg-surface-raised"
          }`}
        >
          Vender
        </button>
      </div>

      {/* Side selector */}
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

      {/* Show position info when selling */}
      {action === "sell" && isSignedIn && (
        <div className="text-xs text-text-secondary mb-2 px-1">
          Seus contratos {side === "yes" ? "Sim" : "Não"}: <span className="font-mono font-medium text-text">{myShares.toFixed(1)}</span>
        </div>
      )}

      <label className="block text-xs text-text-secondary mb-1.5">
        {action === "buy" ? "Valor (R$)" : "Contratos para vender"}
      </label>
      <div className="relative mb-3">
        {action === "buy" && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">R$</span>
        )}
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={action === "buy" ? "0,00" : "0"}
          className={`w-full ${action === "buy" ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-md border bg-surface-raised text-text font-mono text-sm focus:outline-none transition-colors ${
            error ? "border-down focus:border-down" : "border-border focus:border-accent"
          }`}
        />
      </div>
      {error && (
        <p className="text-[11px] text-down -mt-2 mb-3">
          {error}
          {insufficientBalance && (
            <Link href="/carteira" className="ml-1 text-accent hover:underline">Depositar →</Link>
          )}
        </p>
      )}

      {action === "buy" && (
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
      )}

      {action === "sell" && myShares > 0 && (
        <div className="flex gap-2 mb-4">
          {[25, 50, 75, 100].map((pct) => {
            const val = Math.floor((myShares * pct) / 100 * 10) / 10;
            return (
              <button
                type="button"
                key={pct}
                onClick={() => setAmount(String(val))}
                className="flex-1 py-1.5 rounded text-xs font-medium border border-border text-text-secondary hover:border-border-strong hover:text-text transition-colors"
              >
                {pct}%
              </button>
            );
          })}
        </div>
      )}

      {numAmount >= MIN_AMOUNT && (
        <div className="space-y-2 mb-4 p-3 rounded-md bg-surface-raised text-xs">
          {quoteLoading ? (
            <div className="flex items-center justify-center py-2 text-text-tertiary">
              <span className="animate-pulse">Calculando...</span>
            </div>
          ) : quote ? (
            <>
              <div className="flex justify-between">
                <span className="text-text-secondary">Preço médio</span>
                <span className="font-mono text-text">R$ {quote.avgPrice.toFixed(4)}</span>
              </div>
              {action === "buy" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Contratos</span>
                    <span className="font-mono text-text">{quote.shares.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Retorno se {side === "yes" ? "Sim" : "Não"}</span>
                    <span className="font-mono text-up">R$ {payout.toFixed(2)} (+{profitPct.toFixed(1)}%)</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Você recebe</span>
                  <span className="font-mono text-up">{formatCurrency(payout)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Taxa ({((market.feeRate ?? 0.02) * 100).toFixed(0)}%)</span>
                <span className="font-mono text-text">R$ {quote.fee.toFixed(2)}</span>
              </div>
              {quote.priceImpact > 0.01 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Impacto no preço</span>
                  <span className={`font-mono ${Math.abs(quote.priceImpact) > 0.05 ? "text-neutral-warn" : "text-text-tertiary"}`}>
                    {(quote.priceImpact * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-2 text-text-tertiary text-xs">
              Erro ao calcular cotação
            </div>
          )}
        </div>
      )}

      {!isSignedIn ? (
        <Link
          href="/auth/cadastro"
          className="flex items-center justify-center w-full py-2.5 rounded-md bg-highlight hover:bg-highlight-hover text-white font-semibold text-sm transition-colors"
        >
          Criar conta para negociar
        </Link>
      ) : (
        <button
          type="button"
          disabled={!validAmount || isSubmitting || quoteLoading}
          onClick={handleTrade}
          className={`w-full py-2.5 rounded-md disabled:bg-surface-raised disabled:text-text-tertiary text-white font-semibold text-sm transition-colors ${
            action === "buy"
              ? "bg-highlight hover:bg-highlight-hover"
              : "bg-down hover:bg-down/80"
          }`}
        >
          {isSubmitting
            ? "Processando..."
            : !amount
            ? `Insira ${action === "buy" ? "um valor" : "a quantidade"}`
            : insufficientBalance
            ? "Saldo insuficiente"
            : insufficientShares
            ? "Contratos insuficientes"
            : !validAmount
            ? "Valor inválido"
            : action === "buy"
            ? `Comprar ${side === "yes" ? "Sim" : "Não"} · R$ ${numAmount.toFixed(2)}`
            : `Vender ${numAmount.toFixed(1)} ${side === "yes" ? "Sim" : "Não"}`}
        </button>
      )}
    </div>
  );
}

const MAX_COMMENT_LENGTH = 500;

interface CommentData {
  id: string;
  text: string;
  like_count: number;
  liked_by_me: boolean;
  created_at: string;
  user: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
}

function CommentInput({ marketId, onSuccess }: { marketId: string; onSuccess: () => void }) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const remaining = MAX_COMMENT_LENGTH - text.length;
  const overLimit = remaining < 0;

  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  const handleSubmit = async () => {
    if (!isSignedIn) {
      toast.error("Faça login para comentar");
      return;
    }
    if (!text.trim() || overLimit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: marketId, text: text.trim() }),
      });
      if (res.ok) {
        setText("");
        toast.success("Comentário publicado");
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.message || "Erro ao publicar comentário");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          disabled={!text.trim() || overLimit || isSubmitting}
          onClick={handleSubmit}
          className="px-3 py-1 rounded-md bg-accent text-white text-xs font-semibold disabled:bg-surface-raised disabled:text-text-tertiary transition-colors"
        >
          {isSubmitting ? "Enviando..." : "Comentar"}
        </button>
      </div>
    </div>
  );
}

function Comments({ marketId }: { marketId: string }) {
  const { data, refetch } = useQuery({
    queryKey: ["comments", marketId],
    queryFn: () => fetch(`/api/comments?market_id=${marketId}`).then((r) => r.json()),
  });

  const comments: CommentData[] = data?.comments ?? [];

  const handleLike = async (commentId: string) => {
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      refetch();
    } catch {
      toast.error("Erro ao curtir");
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Comentários</h3>
        <span className="text-xs text-text-tertiary">{comments.length}</span>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-text-tertiary py-4 text-center">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] text-accent font-bold">
                  {c.user.display_name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <Link href={`/u/${c.user.handle}`} className="text-sm font-medium text-accent hover:underline">@{c.user.handle}</Link>
                <span className="text-[10px] text-text-tertiary ml-auto">{formatRelativeTime(c.created_at)}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed ml-8">{c.text}</p>
              <div className="flex items-center gap-3 mt-2 ml-8">
                <button
                  type="button"
                  onClick={() => handleLike(c.id)}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    c.liked_by_me ? "text-accent" : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <Icon name="thumbs-up" className="w-3 h-3" />
                  {c.like_count}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CommentInput marketId={marketId} onSuccess={() => refetch()} />
    </div>
  );
}

function WatchlistButton({ marketId }: { marketId: string }) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  // Load initial watchlist state
  const { data: watchlistData } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => fetch("/api/watchlist").then((r) => r.json()),
    enabled: isSignedIn,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (watchlistData?.watchlist) {
      const ids = (watchlistData.watchlist as Array<{ market_id: string }>).map((w) => w.market_id);
      setIsInWatchlist(ids.includes(marketId));
    }
  }, [watchlistData, marketId]);

  const handleToggle = async () => {
    if (!isSignedIn) {
      toast.error("Faça login para seguir mercados");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_id: marketId }),
      });
      if (res.status === 401) {
        toast.error("Faça login para seguir mercados");
      } else if (res.ok) {
        const data = await res.json();
        setIsInWatchlist(data.action === "added");
        toast.success(data.action === "added" ? "Adicionado à watchlist" : "Removido da watchlist");
        queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs transition-colors ${
        isInWatchlist
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-text-secondary hover:text-text hover:border-border-strong"
      }`}
    >
      <Icon name="star" className="w-3.5 h-3.5" />
      {isInWatchlist ? "Seguindo" : "Seguir"}
    </button>
  );
}

function ClaimButton({ market }: { market: MarketDetail }) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const queryClient = useQueryClient();

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const res = await fetch(`/api/markets/${market.slug}/claim`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "nothing_to_claim") {
          toast.info("Nenhum ganho para resgatar neste mercado.");
        } else {
          toast.error(data.message || "Erro ao resgatar");
        }
      } else {
        const amount = data.payout_amount ?? data.amount ?? 0;
        toast.success(`Resgatado! ${formatCurrency(amount)} adicionado à carteira.`);
        setClaimed(true);
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
        queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={isClaiming || claimed}
      className="mt-3 px-4 py-2 rounded-md bg-up/10 text-up text-sm font-semibold hover:bg-up/20 disabled:opacity-50 transition-colors"
    >
      {claimed ? "Resgatado!" : isClaiming ? "Resgatando..." : "Resgatar ganhos →"}
    </button>
  );
}

function TopHolders({ marketId }: { marketId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["top-holders", marketId],
    queryFn: async () => {
      const res = await fetch(`/api/markets/holders?market_id=${marketId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.holders ?? [];
    },
    staleTime: 60 * 1000,
  });

  const holders = (data ?? []) as Array<{
    handle: string;
    side: string;
    total_quantity: number;
    total_value: number;
  }>;

  if (isLoading) {
    return (
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Transparência</h3>
        <p className="text-xs text-text-tertiary animate-pulse py-2">Carregando...</p>
      </div>
    );
  }

  if (holders.length === 0) return null;

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold mb-3">Transparência</h3>
      <div className="space-y-2 text-xs">
        <p className="text-text-tertiary uppercase tracking-wider mb-2">Top holders</p>
        {holders.slice(0, 5).map((h, i) => (
          <div key={h.handle} className="flex items-center gap-2 text-text-secondary">
            <span className="w-4 text-right text-text-tertiary">{i + 1}.</span>
            <Link href={`/u/${h.handle}`} className="text-accent hover:underline">@{h.handle}</Link>
            <span className="flex-1" />
            <span className="font-mono">{formatCurrency(h.total_value)}</span>
            <span className={h.side === "yes" ? "text-up" : "text-down"}>{h.side === "yes" ? "Sim" : "Não"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketView({ market }: { market: MarketDetail }) {
  const isResolved = market.status.startsWith("resolved");
  const catIcon = categoryIcons[market.category] || "trend-up";
  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

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
          <WatchlistButton marketId={market.id} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copiado!");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs text-text-secondary hover:text-text hover:border-border-strong transition-colors"
          >
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
          {isSignedIn && <ClaimButton market={market} />}
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

          <TopHolders marketId={market.id} />
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
