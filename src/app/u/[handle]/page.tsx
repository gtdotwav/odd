import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import { formatCurrency, formatVolume, formatDate } from "@/lib/utils";
import Link from "next/link";
import FollowButton from "./FollowButton";

interface PublicPosition {
  id: string;
  marketSlug: string;
  marketTitle: string;
  side: "yes" | "no";
  quantity: number;
  currentPrice: number;
}

interface PublicProfile {
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  total_trades: number;
  total_volume: number;
  total_pnl: number;
  win_rate: number;
  followers: number;
  following: number;
  positions: Array<{
    id: string;
    market_slug: string;
    market_title: string;
    side: "yes" | "no";
    quantity: number;
    current_price: number;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_profile", {
    p_handle: handle,
  });

  const profile = data as unknown as PublicProfile | null;

  if (!profile) {
    return { title: "Usuário não encontrado" };
  }

  return {
    title: `${profile.display_name} (@${profile.handle})`,
    description: `Perfil de ${profile.display_name} na Odd. ${profile.total_trades} trades, ${formatVolume(profile.total_volume)} em volume.`,
    openGraph: {
      title: `${profile.display_name} (@${profile.handle}) | Odd`,
      description: profile.bio || `Perfil de ${profile.display_name} na Odd.`,
    },
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_profile", {
    p_handle: handle,
  });

  if (error || !data) {
    notFound();
  }

  const user = data as unknown as PublicProfile;

  const avatarInitial = user.display_name?.charAt(0)?.toUpperCase() || user.handle.charAt(0).toUpperCase();
  const trades = user.total_trades ?? 0;
  const volume = user.total_volume ?? 0;
  const pnl = user.total_pnl ?? 0;
  const winRate = user.win_rate ?? 0;
  const followers = user.followers ?? 0;
  const following = user.following ?? 0;
  const positions: PublicPosition[] = (user.positions ?? []).map((p) => ({
    id: p.id,
    marketSlug: p.market_slug,
    marketTitle: p.market_title,
    side: p.side,
    quantity: p.quantity,
    currentPrice: p.current_price,
  }));

  return (
    <div className="flex max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 md:px-6 py-5">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-3xl font-bold text-accent shrink-0">
            {avatarInitial}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text">{user.display_name}</h1>
            <p className="text-sm text-text-tertiary mb-2">@{user.handle}</p>
            {user.bio && (
              <p className="text-sm text-text-secondary mb-3 max-w-lg">{user.bio}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-text-tertiary">
              <span>Membro desde {formatDate(user.created_at)}</span>
              <span className="text-border">|</span>
              <span><strong className="text-text font-medium">{followers}</strong> seguidores</span>
              <span className="text-border">|</span>
              <span><strong className="text-text font-medium">{following}</strong> seguindo</span>
            </div>
          </div>
          <FollowButton handle={user.handle} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Trades</p>
            <p className="text-lg font-mono font-bold text-text">{trades}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Volume</p>
            <p className="text-lg font-mono font-bold text-text">{formatVolume(volume)}</p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">PnL</p>
            <p className={`text-lg font-mono font-bold ${pnl >= 0 ? "text-up" : "text-down"}`}>
              {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Win rate</p>
            <p className="text-lg font-mono font-bold text-text">{(winRate * 100).toFixed(0)}%</p>
          </div>
        </div>

        {/* Public positions */}
        <section>
          <h2 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider mb-3">
            Posicoes publicas
          </h2>
          {positions.length === 0 ? (
            <p className="text-sm text-text-tertiary py-4">Nenhuma posicao publica.</p>
          ) : (
            <div className="space-y-2">
              {positions.map((pos) => (
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
