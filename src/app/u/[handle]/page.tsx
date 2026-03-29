import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { formatCurrency, formatVolume, formatDate } from "@/lib/utils";
import Link from "next/link";

interface UserProfile {
  handle: string;
  displayName: string;
  avatarInitial: string;
  bio: string;
  memberSince: string;
  trades: number;
  volume: number;
  pnl: number;
  winRate: number;
  followers: number;
  following: number;
  positions: PublicPosition[];
}

interface PublicPosition {
  id: string;
  marketSlug: string;
  marketTitle: string;
  side: "yes" | "no";
  quantity: number;
  currentPrice: number;
}

// Mock data — will be replaced by API call
function getMockUser(handle: string): UserProfile {
  return {
    handle,
    displayName: handle.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    avatarInitial: handle.charAt(0).toUpperCase(),
    bio: "Trader ativo na Odd. Foco em macroeconomia e politica brasileira.",
    memberSince: "2026-01-15",
    trades: 234,
    volume: 567000,
    pnl: 4520,
    winRate: 0.62,
    followers: 128,
    following: 45,
    positions: [
      {
        id: "p1",
        marketSlug: "selic-sobe-maio-2026",
        marketTitle: "Selic sobe na reuniao do Copom em maio?",
        side: "yes",
        quantity: 50,
        currentPrice: 0.78,
      },
      {
        id: "p2",
        marketSlug: "bitcoin-100k-junho",
        marketTitle: "Bitcoin ultrapassa US$ 100k em junho?",
        side: "no",
        quantity: 30,
        currentPrice: 0.38,
      },
      {
        id: "p3",
        marketSlug: "brasil-copa-2026",
        marketTitle: "Brasil ganha a Copa do Mundo 2026?",
        side: "yes",
        quantity: 100,
        currentPrice: 0.19,
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const user = getMockUser(handle);
  return {
    title: `${user.displayName} (@${user.handle})`,
    description: `Perfil de ${user.displayName} na Odd. ${user.trades} trades, ${formatVolume(user.volume)} em volume.`,
    openGraph: {
      title: `${user.displayName} (@${user.handle}) | Odd`,
      description: user.bio,
    },
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // TODO: fetch from /api/users/{handle}
  const user = getMockUser(handle);

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent shrink-0">
            {user.avatarInitial}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text">{user.displayName}</h1>
            <p className="text-sm text-text-tertiary mb-2">@{user.handle}</p>
            <p className="text-sm text-text-secondary mb-3 max-w-lg">{user.bio}</p>
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <span>Membro desde {formatDate(user.memberSince)}</span>
              <span className="text-border">|</span>
              <span><strong className="text-text font-medium">{user.followers}</strong> seguidores</span>
              <span className="text-border">|</span>
              <span><strong className="text-text font-medium">{user.following}</strong> seguindo</span>
            </div>
          </div>
          <button
            type="button"
            className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:text-text hover:border-border-strong transition-colors shrink-0"
          >
            Seguir
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Trades</p>
            <p className="text-lg font-mono font-bold text-text">{user.trades}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Volume</p>
            <p className="text-lg font-mono font-bold text-text">{formatVolume(user.volume)}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">PnL</p>
            <p className={`text-lg font-mono font-bold ${user.pnl >= 0 ? "text-up" : "text-down"}`}>
              {user.pnl >= 0 ? "+" : ""}{formatCurrency(user.pnl)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Win rate</p>
            <p className="text-lg font-mono font-bold text-text">{(user.winRate * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Public positions */}
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Posicoes publicas
          </h2>
          {user.positions.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">Nenhuma posicao publica.</p>
          ) : (
            <div className="space-y-2">
              {user.positions.map((pos) => (
                <Link
                  key={pos.id}
                  href={`/mercado/${pos.marketSlug}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border bg-surface hover:border-border-strong hover:bg-surface-raised transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-text truncate">{pos.marketTitle}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        pos.side === "yes" ? "bg-up/10 text-up" : "bg-down/10 text-down"
                      }`}>
                        {pos.side === "yes" ? "Sim" : "Nao"}
                      </span>
                      <span className="text-xs text-text-tertiary">{pos.quantity} contratos</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-tertiary">Preco atual</p>
                    <p className="font-mono text-sm font-medium text-text">{formatCurrency(pos.currentPrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
