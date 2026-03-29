import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import Icon from "@/components/Icon";
import { formatCurrency, formatVolume } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rankings",
  description: "Ranking dos melhores traders nos mercados de previsao da Odd.",
};

interface RankedUser {
  rank: number;
  handle: string;
  displayName: string;
  avatarInitial: string;
  volume: number;
  trades: number;
  pnl: number;
  winRate: number;
}

const mockLeaderboard: RankedUser[] = [
  { rank: 1, handle: "carla_invest", displayName: "Carla Mendes", avatarInitial: "C", volume: 892000, trades: 342, pnl: 12450, winRate: 0.68 },
  { rank: 2, handle: "trader_rj", displayName: "Rafael Oliveira", avatarInitial: "R", volume: 745000, trades: 289, pnl: 9830, winRate: 0.64 },
  { rank: 3, handle: "ana_sp", displayName: "Ana Costa", avatarInitial: "A", volume: 623000, trades: 215, pnl: 7200, winRate: 0.61 },
  { rank: 4, handle: "marcos_bh", displayName: "Marcos Silva", avatarInitial: "M", volume: 510000, trades: 198, pnl: 5600, winRate: 0.59 },
  { rank: 5, handle: "julia_macro", displayName: "Julia Ferreira", avatarInitial: "J", volume: 489000, trades: 176, pnl: 4300, winRate: 0.57 },
  { rank: 6, handle: "pedro_cripto", displayName: "Pedro Santos", avatarInitial: "P", volume: 412000, trades: 154, pnl: 3100, winRate: 0.55 },
  { rank: 7, handle: "lucas_fut", displayName: "Lucas Pereira", avatarInitial: "L", volume: 378000, trades: 143, pnl: 2800, winRate: 0.54 },
  { rank: 8, handle: "bia_politics", displayName: "Beatriz Lima", avatarInitial: "B", volume: 345000, trades: 132, pnl: 2200, winRate: 0.53 },
  { rank: 9, handle: "diego_trade", displayName: "Diego Almeida", avatarInitial: "D", volume: 298000, trades: 121, pnl: 1850, winRate: 0.52 },
  { rank: 10, handle: "fernanda_mk", displayName: "Fernanda Rocha", avatarInitial: "F", volume: 267000, trades: 109, pnl: 1500, winRate: 0.51 },
];

const podiumColors = ["bg-amber-400", "bg-gray-300", "bg-amber-600"];
const podiumTextColors = ["text-amber-600", "text-gray-500", "text-amber-700"];

function TopThreeCard({ user, index }: { user: RankedUser; index: number }) {
  return (
    <Link
      href={`/u/${user.handle}`}
      className="flex flex-col items-center p-5 rounded-xl border border-border bg-surface hover:border-border-strong hover:shadow-md transition-all"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 ${podiumColors[index]}`}>
        {user.avatarInitial}
      </div>
      <span className={`text-xs font-bold mb-1 ${podiumTextColors[index]}`}>
        #{user.rank}
      </span>
      <h3 className="text-sm font-semibold text-text">{user.displayName}</h3>
      <p className="text-xs text-text-tertiary mb-3">@{user.handle}</p>
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">PnL</span>
          <span className="font-mono font-semibold text-up">+{formatCurrency(user.pnl)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">Volume</span>
          <span className="font-mono font-medium text-text">{formatVolume(user.volume)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">Win rate</span>
          <span className="font-mono font-medium text-text">{(user.winRate * 100).toFixed(0)}%</span>
        </div>
      </div>
    </Link>
  );
}

export default async function RankingsPage() {
  // TODO: fetch from /api/leaderboard
  const leaderboard = mockLeaderboard;
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-text">Rankings</h1>
          <span className="text-xs text-text-tertiary">Top traders por PnL</span>
        </div>

        {/* Top 3 podium */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {topThree.map((user, i) => (
            <TopThreeCard key={user.handle} user={user} index={i} />
          ))}
        </div>

        {/* Remaining table */}
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_5rem_7rem_5rem] gap-4 px-4 py-2.5 border-b border-border bg-surface-raised text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
            <span>#</span>
            <span>Trader</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Trades</span>
            <span className="text-right">PnL</span>
            <span className="text-right">Win %</span>
          </div>
          {/* Rows */}
          {rest.map((user) => (
            <Link
              key={user.handle}
              href={`/u/${user.handle}`}
              className="grid grid-cols-[3rem_1fr_6rem_5rem_7rem_5rem] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-raised transition-colors items-center"
            >
              <span className="text-sm font-mono font-medium text-text-tertiary">{user.rank}</span>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                  {user.avatarInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{user.displayName}</p>
                  <p className="text-xs text-text-tertiary">@{user.handle}</p>
                </div>
              </div>
              <span className="text-xs font-mono text-text text-right">{formatVolume(user.volume)}</span>
              <span className="text-xs font-mono text-text text-right">{user.trades}</span>
              <span className="text-xs font-mono font-semibold text-up text-right">+{formatCurrency(user.pnl)}</span>
              <span className="text-xs font-mono text-text text-right">{(user.winRate * 100).toFixed(0)}%</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
