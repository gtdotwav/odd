import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rankings",
  description: "Ranking dos melhores traders nos mercados de previsão da Odd.",
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
