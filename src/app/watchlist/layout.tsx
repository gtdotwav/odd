import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Mercados que você está acompanhando na Odd.",
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
