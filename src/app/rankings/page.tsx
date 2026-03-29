"use client";

import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import { Skeleton } from "@/components/Skeleton";
import { formatCurrency, formatVolume } from "@/lib/utils";
import Link from "next/link";

interface RankedUser {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  total_volume: number;
  total_trades: number;
  total_pnl: number;
}

const podiumColors = ["bg-amber-400", "bg-gray-300", "bg-amber-600"];
const podiumTextColors = ["text-amber-600", "text-gray-500", "text-amber-700"];

function TopThreeCard({ user, index }: { user: RankedUser; index: number }) {
  return (
    <Link
      href={`/u/${user.handle}`}
      className="flex flex-col items-center p-5 rounded-xl border border-border bg-surface hover:border-border-strong hover:shadow-md transition-all"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-3 ${podiumColors[index]}`}>
        {user.display_name?.[0]?.toUpperCase() ?? "U"}
      </div>
      <span className={`text-xs font-bold mb-1 ${podiumTextColors[index]}`}>
        #{index + 1}
      </span>
      <h3 className="text-sm font-semibold text-text">{user.display_name}</h3>
      <p className="text-xs text-text-tertiary mb-3">@{user.handle}</p>
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">PnL</span>
          <span className={`font-mono font-semibold ${user.total_pnl >= 0 ? "text-up" : "text-down"}`}>
            {user.total_pnl >= 0 ? "+" : ""}{formatCurrency(user.total_pnl)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">Volume</span>
          <span className="font-mono font-medium text-text">{formatVolume(user.total_volume)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-text-tertiary">Trades</span>
          <span className="font-mono font-medium text-text">{user.total_trades}</span>
        </div>
      </div>
    </Link>
  );
}

export default function RankingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then((r) => r.json()),
  });

  const leaderboard: RankedUser[] = data?.leaderboard ?? [];
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

        {isLoading ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-xl border border-border bg-surface flex flex-col items-center">
                  <Skeleton className="w-14 h-14 rounded-full mb-3" />
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16 mb-3" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg mb-1" />
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-text-tertiary py-8 text-center">Nenhum trader no ranking ainda.</p>
        ) : (
          <>
            {/* Top 3 podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {topThree.map((user, i) => (
                <TopThreeCard key={user.user_id} user={user} index={i} />
              ))}
            </div>

            {/* Remaining table */}
            {rest.length > 0 && (
              <div className="rounded-lg border border-border bg-surface overflow-hidden">
                <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_5rem_7rem] gap-4 px-4 py-2.5 border-b border-border bg-surface-raised text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
                  <span>#</span>
                  <span>Trader</span>
                  <span className="text-right">Volume</span>
                  <span className="text-right">Trades</span>
                  <span className="text-right">PnL</span>
                </div>
                {rest.map((user, i) => (
                  <Link
                    key={user.user_id}
                    href={`/u/${user.handle}`}
                    className="grid grid-cols-[3rem_1fr_6rem_5rem_7rem] gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-surface-raised transition-colors items-center"
                  >
                    <span className="text-sm font-mono font-medium text-text-tertiary">{i + 4}</span>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent shrink-0">
                        {user.display_name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text truncate">{user.display_name}</p>
                        <p className="text-xs text-text-tertiary">@{user.handle}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text text-right">{formatVolume(user.total_volume)}</span>
                    <span className="text-xs font-mono text-text text-right">{user.total_trades}</span>
                    <span className={`text-xs font-mono font-semibold text-right ${user.total_pnl >= 0 ? "text-up" : "text-down"}`}>
                      {user.total_pnl >= 0 ? "+" : ""}{formatCurrency(user.total_pnl)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
