import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Suas posições, ordens e performance nos mercados de previsão da Odd.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
