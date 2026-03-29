import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carteira",
  description: "Gerencie seu saldo, depositos e saques na Odd.",
};

interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "trade_buy" | "trade_sell" | "payout" | "fee";
  description: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "failed";
}

const typeConfig: Record<string, { icon: string; label: string; className: string }> = {
  deposit: { icon: "trend-up", label: "Deposito", className: "text-up" },
  withdraw: { icon: "share", label: "Saque", className: "text-down" },
  trade_buy: { icon: "zap", label: "Compra", className: "text-down" },
  trade_sell: { icon: "zap", label: "Venda", className: "text-up" },
  payout: { icon: "gift", label: "Pagamento", className: "text-up" },
  fee: { icon: "shield", label: "Taxa", className: "text-down" },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  completed: { label: "Concluido", className: "bg-up/10 text-up" },
  pending: { label: "Pendente", className: "bg-neutral-warn/15 text-neutral-warn" },
  failed: { label: "Falhou", className: "bg-down/10 text-down" },
};

// Mock data
const mockBalance = 1247.83;

const mockTransactions: Transaction[] = [
  {
    id: "t1",
    type: "deposit",
    description: "Deposito via Pix",
    amount: 500.0,
    date: "2026-03-28T16:00:00Z",
    status: "completed",
  },
  {
    id: "t2",
    type: "trade_buy",
    description: "Compra 50x Sim — Selic sobe maio?",
    amount: -32.5,
    date: "2026-03-28T14:30:00Z",
    status: "completed",
  },
  {
    id: "t3",
    type: "fee",
    description: "Taxa de operacao",
    amount: -0.65,
    date: "2026-03-28T14:30:00Z",
    status: "completed",
  },
  {
    id: "t4",
    type: "trade_sell",
    description: "Venda 20x Nao — Bitcoin 100k junho?",
    amount: 11.0,
    date: "2026-03-27T10:15:00Z",
    status: "completed",
  },
  {
    id: "t5",
    type: "payout",
    description: "Pagamento — Lula veta marco temporal?",
    amount: 85.0,
    date: "2026-03-26T08:00:00Z",
    status: "completed",
  },
  {
    id: "t6",
    type: "withdraw",
    description: "Saque via Pix",
    amount: -200.0,
    date: "2026-03-25T12:00:00Z",
    status: "completed",
  },
  {
    id: "t7",
    type: "deposit",
    description: "Deposito via Pix",
    amount: 1000.0,
    date: "2026-03-20T09:00:00Z",
    status: "completed",
  },
];

function TransactionRow({ tx }: { tx: Transaction }) {
  const config = typeConfig[tx.type] ?? typeConfig.deposit;
  const status = statusLabels[tx.status] ?? statusLabels.completed;
  const isPositive = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface hover:bg-surface-raised transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
        isPositive ? "bg-up/10" : "bg-surface-raised"
      }`}>
        <Icon name={config.icon} className={`w-4 h-4 ${config.className}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{tx.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-text-tertiary">{formatRelativeTime(tx.date)}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>
      </div>
      <p className={`font-mono text-sm font-semibold shrink-0 ${isPositive ? "text-up" : "text-text"}`}>
        {isPositive ? "+" : ""}{formatCurrency(tx.amount)}
      </p>
    </div>
  );
}

export default async function CarteiraPage() {
  // TODO: fetch from /api/wallet and /api/wallet/transactions
  const balance = mockBalance;
  const transactions = mockTransactions;

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <h1 className="text-xl font-bold text-text mb-6">Carteira</h1>

        {/* Balance card */}
        <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-accent/5 via-surface to-surface mb-6">
          <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1">Saldo disponivel</p>
          <p className="text-3xl font-mono font-bold text-text mb-4">{formatCurrency(balance)}</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
            >
              Depositar
            </button>
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong text-sm font-medium transition-colors"
            >
              Sacar
            </button>
          </div>
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Em posicoes</p>
            <p className="text-lg font-mono font-bold text-text">{formatCurrency(84.2)}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Total depositado</p>
            <p className="text-lg font-mono font-bold text-text">{formatCurrency(1500.0)}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Total sacado</p>
            <p className="text-lg font-mono font-bold text-text">{formatCurrency(200.0)}</p>
          </div>
        </div>

        {/* Transaction history */}
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Historico de transacoes
          </h2>
          {transactions.length === 0 ? (
            <EmptyState
              icon="bar-chart"
              title="Nenhuma transacao"
              description="Faca um deposito para comecar a negociar."
            />
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
