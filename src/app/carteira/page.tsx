"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import EmptyState from "@/components/EmptyState";
import Icon from "@/components/Icon";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import OnboardingBanner from "@/components/OnboardingBanner";

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  balance_after: number;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

const typeConfig: Record<string, { icon: string; label: string; className: string }> = {
  deposit: { icon: "trend-up", label: "Depósito", className: "text-up" },
  withdrawal: { icon: "share", label: "Saque", className: "text-down" },
  trade_buy: { icon: "zap", label: "Compra", className: "text-down" },
  trade_sell: { icon: "zap", label: "Venda", className: "text-up" },
  payout: { icon: "gift", label: "Pagamento", className: "text-up" },
  fee: { icon: "shield", label: "Taxa", className: "text-down" },
  refund: { icon: "gift", label: "Reembolso", className: "text-up" },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  completed: { label: "Concluído", className: "bg-up/10 text-up" },
  pending: { label: "Pendente", className: "bg-neutral-warn/15 text-neutral-warn" },
  failed: { label: "Falhou", className: "bg-down/10 text-down" },
};

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
          <span className="text-xs text-text-tertiary">{formatRelativeTime(tx.created_at)}</span>
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

function DepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const numAmount = parseFloat(amount) || 0;

  const handleDeposit = async () => {
    if (numAmount < 5 || numAmount > 50000 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Erro ao depositar");
      } else {
        toast.success(`Depósito de ${formatCurrency(numAmount)} realizado`);
        onSuccess();
        onClose();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Depositar</h2>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-warn bg-neutral-warn/10 rounded-md px-3 py-2 mb-4">
          Ambiente de testes — saldo adicionado diretamente.
        </p>

        <label className="block text-xs text-text-secondary mb-1.5">Valor do depósito</label>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">R$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full pl-9 pr-3 py-2.5 rounded-md border border-border bg-surface-raised text-text font-mono text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex gap-2 mb-4">
          {["50", "100", "500", "1000"].map((v) => (
            <button type="button" key={v} onClick={() => setAmount(v)} className="flex-1 py-1.5 rounded text-xs font-medium border border-border text-text-secondary hover:border-border-strong hover:text-text transition-colors">
              R${v}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={numAmount < 5 || numAmount > 50000 || isSubmitting}
          onClick={handleDeposit}
          className="w-full py-2.5 rounded-md bg-highlight hover:bg-highlight-hover disabled:bg-surface-raised disabled:text-text-tertiary text-white font-semibold text-sm transition-colors"
        >
          {isSubmitting ? "Processando..." : numAmount > 0 ? `Depositar ${formatCurrency(numAmount)}` : "Insira um valor"}
        </button>
      </div>
    </div>
  );
}

function WithdrawModal({ onClose, onSuccess, balance, savedPixKey, savedPixKeyType }: { onClose: () => void; onSuccess: () => void; balance: number; savedPixKey?: string | null; savedPixKeyType?: string | null }) {
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState(savedPixKey || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const numAmount = parseFloat(amount) || 0;

  const handleWithdraw = async () => {
    if (numAmount < 10 || numAmount > balance || !pixKey.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, pix_key: pixKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || "Erro ao sacar");
      } else {
        toast.success(`Saque de ${formatCurrency(numAmount)} solicitado`);
        onSuccess();
        onClose();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text">Sacar</h2>
          <button type="button" onClick={onClose} className="text-text-tertiary hover:text-text">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-text-tertiary mb-4">
          Saldo disponível: <span className="font-mono font-semibold text-text">{formatCurrency(balance)}</span>
        </p>

        <label className="block text-xs text-text-secondary mb-1.5">Valor do saque</label>
        <div className="relative mb-3">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">R$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="w-full pl-9 pr-3 py-2.5 rounded-md border border-border bg-surface-raised text-text font-mono text-sm focus:outline-none focus:border-accent"
          />
        </div>

        <label className="block text-xs text-text-secondary mb-1.5">Chave Pix</label>
        {savedPixKey && (
          <p className="text-[11px] text-up mb-1.5 flex items-center gap-1">
            <Icon name="check-circle" className="w-3 h-3" />
            Usando chave {savedPixKeyType?.toUpperCase()} cadastrada
          </p>
        )}
        <input
          type="text"
          value={pixKey}
          onChange={(e) => setPixKey(e.target.value)}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
          className="w-full px-3 py-2.5 rounded-md border border-border bg-surface-raised text-text text-sm focus:outline-none focus:border-accent mb-4"
        />

        {numAmount > balance && (
          <p className="text-[11px] text-down mb-3">Saldo insuficiente</p>
        )}

        <button
          type="button"
          disabled={numAmount < 10 || numAmount > balance || !pixKey.trim() || isSubmitting}
          onClick={handleWithdraw}
          className="w-full py-2.5 rounded-md bg-highlight hover:bg-highlight-hover disabled:bg-surface-raised disabled:text-text-tertiary text-white font-semibold text-sm transition-colors"
        >
          {isSubmitting ? "Processando..." : numAmount > 0 ? `Sacar ${formatCurrency(numAmount)}` : "Insira um valor"}
        </button>
      </div>
    </div>
  );
}

export default function CarteiraPage() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  const { isSignedIn: clerkSignedIn } = useAuth();
  const isSignedIn = !!clerkSignedIn;

  const { data, isLoading } = useQuery<WalletData>({
    queryKey: ["wallet"],
    queryFn: () => fetch("/api/wallet").then((r) => r.json()),
    enabled: isSignedIn,
  });

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];

  const totalDeposited = transactions
    .filter((t) => t.type === "deposit" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const inPositions = transactions
    .filter((t) => t.type === "trade_buy" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["wallet"] });

  if (!isSignedIn) {
    return (
      <div className="flex max-w-[1440px] mx-auto">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
          <h1 className="text-xl font-bold text-text mb-6">Carteira</h1>
          <EmptyState icon="gift" title="Faça login" description="Entre na sua conta para acessar sua carteira." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <OnboardingBanner />
        <h1 className="text-xl font-bold text-text mb-6">Carteira</h1>

        {/* Balance card */}
        <div className="p-6 rounded-xl border border-border bg-gradient-to-br from-accent/5 via-surface to-surface mb-6">
          <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1">Saldo disponível</p>
          {isLoading ? (
            <Skeleton className="h-9 w-40 mb-4" />
          ) : (
            <p className="text-3xl font-mono font-bold text-text mb-4">{formatCurrency(balance)}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDepositOpen(true)}
              className="px-5 py-2.5 rounded-lg bg-highlight hover:bg-highlight-hover text-white text-sm font-semibold transition-colors"
            >
              Depositar
            </button>
            <button
              type="button"
              onClick={() => {
                if (profile?.kyc_status !== "verified") {
                  toast.error("Complete a verificação de identidade (KYC) em Configurações para realizar saques.", { duration: 5000 });
                  return;
                }
                setWithdrawOpen(true);
              }}
              className="px-5 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text hover:border-border-strong text-sm font-medium transition-colors"
            >
              Sacar
            </button>
          </div>
          {profile && profile.kyc_status !== "verified" && (
            <p className="text-xs text-neutral-warn mt-3 flex items-center gap-1.5">
              <Icon name="shield" className="w-3.5 h-3.5" />
              Para sacar, complete a <a href="/config" className="underline font-medium hover:text-text">verificação de identidade</a>.
            </p>
          )}
        </div>

        {/* Quick info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Em posições</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : <p className="text-lg font-mono font-bold text-text">{formatCurrency(inPositions)}</p>}
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Total depositado</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : <p className="text-lg font-mono font-bold text-text">{formatCurrency(totalDeposited)}</p>}
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Total sacado</p>
            {isLoading ? <Skeleton className="h-6 w-20" /> : <p className="text-lg font-mono font-bold text-text">{formatCurrency(totalWithdrawn)}</p>}
          </div>
        </div>

        {/* Transaction history */}
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Histórico de transações
          </h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="bar-chart"
              title="Nenhuma transação"
              description="Faça um depósito para começar a negociar."
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

      {depositOpen && <DepositModal onClose={() => setDepositOpen(false)} onSuccess={refresh} />}
      {withdrawOpen && <WithdrawModal onClose={() => setWithdrawOpen(false)} onSuccess={refresh} balance={balance} savedPixKey={profile?.pix_key} savedPixKeyType={profile?.pix_key_type} />}
    </div>
  );
}
