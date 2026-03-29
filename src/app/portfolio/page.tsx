import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Suas posições, ordens e performance nos mercados de previsão da Odd.",
};

interface Position {
  id: string;
  marketSlug: string;
  marketTitle: string;
  side: "yes" | "no";
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

interface Order {
  id: string;
  marketSlug: string;
  marketTitle: string;
  side: "yes" | "no";
  type: "market" | "limit";
  price: number;
  quantity: number;
  filledQuantity: number;
  status: "pending" | "partial" | "filled" | "cancelled";
  createdAt: string;
}

// Mock data — will be replaced by API calls
const mockPositions: Position[] = [
  {
    id: "1",
    marketSlug: "selic-sobe-maio-2026",
    marketTitle: "Selic sobe na reunião do Copom em maio?",
    side: "yes",
    quantity: 50,
    avgPrice: 0.65,
    currentPrice: 0.78,
    pnl: 6.5,
    pnlPercent: 20,
  },
  {
    id: "2",
    marketSlug: "brasil-copa-2026",
    marketTitle: "Brasil ganha a Copa do Mundo 2026?",
    side: "yes",
    quantity: 100,
    avgPrice: 0.22,
    currentPrice: 0.19,
    pnl: -3.0,
    pnlPercent: -13.6,
  },
  {
    id: "3",
    marketSlug: "bitcoin-100k-junho",
    marketTitle: "Bitcoin ultrapassa US$ 100k em junho?",
    side: "no",
    quantity: 30,
    avgPrice: 0.55,
    currentPrice: 0.62,
    pnl: -2.1,
    pnlPercent: -12.7,
  },
];

const mockOrders: Order[] = [
  {
    id: "o1",
    marketSlug: "selic-sobe-maio-2026",
    marketTitle: "Selic sobe na reunião do Copom em maio?",
    side: "yes",
    type: "limit",
    price: 0.7,
    quantity: 25,
    filledQuantity: 0,
    status: "pending",
    createdAt: "2026-03-28T14:30:00Z",
  },
  {
    id: "o2",
    marketSlug: "bitcoin-100k-junho",
    marketTitle: "Bitcoin ultrapassa US$ 100k em junho?",
    side: "no",
    type: "limit",
    price: 0.6,
    quantity: 40,
    filledQuantity: 15,
    status: "partial",
    createdAt: "2026-03-27T09:15:00Z",
  },
  {
    id: "o3",
    marketSlug: "brasil-copa-2026",
    marketTitle: "Brasil ganha a Copa do Mundo 2026?",
    side: "yes",
    type: "market",
    price: 0.22,
    quantity: 100,
    filledQuantity: 100,
    status: "filled",
    createdAt: "2026-03-25T11:00:00Z",
  },
];

function PositionRow({ position }: { position: Position }) {
  const isPositive = position.pnl >= 0;
  return (
    <Link
      href={`/mercado/${position.marketSlug}`}
      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-raised transition-all"
    >
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text truncate">{position.marketTitle}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            position.side === "yes" ? "bg-up/10 text-up" : "bg-down/10 text-down"
          }`}>
            {position.side === "yes" ? "Sim" : "Nao"}
          </span>
          <span className="text-xs text-text-tertiary">{position.quantity} contratos</span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="text-right">
          <p className="text-text-tertiary">Preco medio</p>
          <p className="font-mono font-medium text-text">{formatCurrency(position.avgPrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Preco atual</p>
          <p className="font-mono font-medium text-text">{formatCurrency(position.currentPrice)}</p>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-text-tertiary">PnL</p>
          <p className={`font-mono font-semibold ${isPositive ? "text-up" : "text-down"}`}>
            {isPositive ? "+" : ""}{formatCurrency(position.pnl)}
            <span className="text-[10px] ml-1">({isPositive ? "+" : ""}{position.pnlPercent.toFixed(1)}%)</span>
          </p>
        </div>
      </div>
    </Link>
  );
}

function OrderRow({ order }: { order: Order }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-accent/10 text-accent" },
    partial: { label: "Parcial", className: "bg-neutral-warn/15 text-neutral-warn" },
    filled: { label: "Executada", className: "bg-up/10 text-up" },
    cancelled: { label: "Cancelada", className: "bg-surface-raised text-text-tertiary" },
  };
  const status = statusConfig[order.status] ?? statusConfig.pending;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 rounded-lg border border-border bg-surface">
      <div className="flex-1 min-w-0">
        <Link href={`/mercado/${order.marketSlug}`} className="text-sm font-medium text-text hover:text-accent truncate block">
          {order.marketTitle}
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            order.side === "yes" ? "bg-up/10 text-up" : "bg-down/10 text-down"
          }`}>
            {order.side === "yes" ? "Sim" : "Nao"}
          </span>
          <span className="text-xs text-text-tertiary uppercase">{order.type}</span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs">
        <div className="text-right">
          <p className="text-text-tertiary">Preco</p>
          <p className="font-mono font-medium text-text">{formatCurrency(order.price)}</p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Qtd</p>
          <p className="font-mono font-medium text-text">
            {order.filledQuantity}/{order.quantity}
          </p>
        </div>
        <div className="text-right">
          <p className="text-text-tertiary">Total</p>
          <p className="font-mono font-medium text-text">{formatCurrency(order.price * order.quantity)}</p>
        </div>
      </div>
    </div>
  );
}

export default async function PortfolioPage() {
  // TODO: fetch from /api/portfolio and /api/orders
  const positions = mockPositions;
  const orders = mockOrders;

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
  const openOrders = orders.filter((o) => o.status === "pending" || o.status === "partial");
  const historyOrders = orders.filter((o) => o.status === "filled" || o.status === "cancelled");

  const hasPositions = positions.length > 0;

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-text">Portfolio</h1>
          <Link
            href="/carteira"
            className="text-sm text-accent hover:underline font-medium"
          >
            Ver carteira
          </Link>
        </div>

        {!hasPositions ? (
          <EmptyState
            icon="bar-chart"
            title="Nenhuma posicao ainda"
            description="Explore os mercados e faca sua primeira operacao para ver suas posicoes aqui."
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
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Posicoes ativas</p>
                <p className="text-lg font-mono font-bold text-text">{positions.length}</p>
              </div>
            </div>

            {/* Positions */}
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Minhas posicoes
              </h2>
              <div className="space-y-2">
                {positions.map((p) => (
                  <PositionRow key={p.id} position={p} />
                ))}
              </div>
            </section>

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
                    <OrderRow key={o.id} order={o} />
                  ))}
                </div>
              )}
            </section>

            {/* History */}
            <section>
              <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
                Historico
              </h2>
              {historyOrders.length === 0 ? (
                <p className="text-sm text-text-tertiary py-4">Nenhuma ordem no historico.</p>
              ) : (
                <div className="space-y-2">
                  {historyOrders.map((o) => (
                    <OrderRow key={o.id} order={o} />
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
